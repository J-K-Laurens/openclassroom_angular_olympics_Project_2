import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartOptions, ChartEvent, ChartType, ChartData } from 'chart.js';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { Observable, of, Subscription } from 'rxjs';
import { Olympic } from 'src/app/core/models/Olympic';
import { OlympicService } from 'src/app/core/services/olympic.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'], 
})
export class HomeComponent implements OnInit, OnDestroy {
  public olympics$: Observable<Olympic[]> = of([]);
  public countries: Olympic[] = []; 
  selectedCountry$: Observable<Olympic | undefined>;
  medalsChartData: ChartData = { datasets: [] };
  private chart: Chart | undefined;
  private subscriptions: Subscription[] = [];
  private subscription: Subscription = new Subscription();

  // Configuration du graphique
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false // Cacher la légende par défaut
      },
      datalabels: {
        color: '#000',       
        textAlign: 'center',  
        font: {
          size: window.innerWidth > 768 ? 25 : 16
        },
        formatter: (value: number, ctx: Context) => {
          return this.countries[ctx.dataIndex]?.country || ''; 
        },
        anchor: 'end',
        align: 'end',
        offset: 10,
        listeners: {
          click: (context: Context) => {
          }
        },
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `🎖️${context.raw as number} médailles`;
          }
        }
      }
    },
    onClick: (event: ChartEvent, elements: { index: number }[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const country = this.countries[index];
        this.selectCountry(country.id);
        
      }
    },
    layout: {
      padding: {
        top: window.innerWidth > 768 ? 140 : 70,
        right: window.innerWidth > 768 ? 140 : 70,
        bottom: window.innerWidth > 768 ? 140 : 70,
        left: window.innerWidth > 768 ? 140 : 95
      }
    }
  };

  // Définis les plugins
  chartPlugins = [ChartDataLabels];

  constructor(
    private olympicService: OlympicService,
    private router: Router
  ) {
    Chart.register(ChartDataLabels);
    this.selectedCountry$ = this.olympicService.getCountryById(1); 
  }

  /**
   * Gère l'adaptation du graphique lors du redimensionnement de la fenêtre
   * Cette fonction est déclenchée à chaque événement de redimensionnement
   */
  @HostListener('window:resize')
  onResize() {
    this.updateChartPadding();
  }

  /**
   * Met à jour dynamiquement le padding et la taille des polices du graphique
   * en fonction de la taille de l'écran pour une meilleure expérience responsive
   * @private
   */
  private updateChartPadding() {
    // Définit le padding en fonction de la largeur de l'écran (140px pour desktop, 100px pour mobile)
    const padding = window.innerWidth > 768 ? 140 : 100;
    // Définit la taille du texte en fonction de la largeur de l'écran (25px pour desktop, 16px pour mobile)
    const fontSize = window.innerWidth > 768 ? 25 : 16;
    if (this.chart) {
      // Applique le nouveau padding au graphique
      this.chart.options.layout = {
        padding: {
          top: padding,
          right: padding,
          bottom: padding,
          left: padding
        }
      };
      // Met à jour la taille de la police des labels
      if (this.chart.options.plugins?.datalabels) {
        this.chart.options.plugins.datalabels = {
          ...this.chart.options.plugins.datalabels,
          font: { size: fontSize }
        };
      }
      // Force la mise à jour du graphique pour appliquer les changements
      this.chart.update();
    }
  }

  ngOnInit(): void {
    this.subscription = this.olympicService.loadInitialData().subscribe(() => {
      this.olympics$ = this.olympicService.getOlympics();
      this.subscription = this.olympics$.subscribe(data => {
        this.countries = data;
      
      this.medalsChartData = {
        labels: this.countries.map(country => country.country),
        datasets: [{
          data: this.countries.map(country => 
            country.participations.reduce((sum, p) => sum + p.medalsCount, 0)
          ),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1,
          datalabels: {
            
            display: true
          }
        }]
      };

      // Détruire le graphique existant s'il existe
      if (this.chart) {
        this.chart.destroy();
      }

      // Créer le graphique après avoir reçu les données
      const ctx = document.querySelector('canvas')?.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'pie',
          data: this.medalsChartData,
          options: this.chartOptions,
          plugins: this.chartPlugins
        });
        this.updateChartPadding();
      }
      });
    });
  }

  ngOnDestroy(): void {
    // Nettoyage du graphique
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
    // Nettoyage des souscriptions
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Navigue vers la page de détail du pays sélectionné
   * @param id - L'identifiant unique du pays sélectionné
   */
  selectCountry(id: number): void {
    this.selectedCountry$ = this.olympicService.getCountryById(id);
    this.router.navigate(['/detail', id]);
  }

  getOlympics(): Observable<Olympic[]> {
    return this.olympics$;
  }
}

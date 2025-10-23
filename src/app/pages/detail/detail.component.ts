import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Olympic } from 'src/app/core/models/Olympic';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { Chart, ChartConfiguration, ChartOptions, Scale } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('lineChart') chartCanvas!: ElementRef;
  public country$: Observable<Olympic | undefined>;
  private chart: Chart | undefined;
  id$: Observable<number>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private olympicService: OlympicService
  ) {
    this.id$ = this.route.paramMap.pipe(
      map(params => {
        const id = params.get('id');
        if (!id) {
          throw new Error('ID parameter is missing');
        }
        const numberId = Number(id);
        if (isNaN(numberId)) {
          throw new Error('Invalid ID parameter');
        }
        return numberId;
      })
    );

    this.country$ = this.id$.pipe(
      switchMap(id => this.olympicService.getCountryById(id)),
      map(country => {
        if (!country) {
          throw new Error('Country not found');
        }
        return country;
      })
    );
  }

  ngOnInit(): void {
    // Charger d'abord les données initiales
    this.olympicService.loadInitialData().subscribe();
  }

  ngAfterViewInit(): void {
    // Attendre que la vue soit complètement initialisée
    setTimeout(() => {
      this.country$.subscribe({
        next: (country) => {
          if (country && this.chartCanvas) {
            this.createChart(country);
          }
        },
        error: (error) => {
          console.error('Error getting country data:', error);
          // Rediriger vers la page 404 en cas d'erreur
          this.router.navigate(['/not-found'], { 
            queryParams: { 
              message: error.message || 'Country data not found'
            }
          });
        }
      });
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  getTotalMedals(country: Olympic): number {
    return country.participations.reduce((sum, p) => sum + p.medalsCount, 0);
  }

  getTotalAthletes(country: Olympic): number {
    return country.participations.reduce((sum, p) => sum + p.athleteCount, 0);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private createChart(country: Olympic): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }

    const data = {
      labels: country.participations.map(p => p.year),
      datasets: [{
        label: 'Medals',
        data: country.participations.map(p => p.medalsCount),
        borderColor: '#008080',
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0 
      }]
    };

    Chart.register(ChartDataLabels);
    
    const config: ChartConfiguration = {
      type: 'line',
      data: data,
      plugins: [ChartDataLabels],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${country.country} - Medals per Olympic Games`
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'end',
            offset: 1,
            font: {
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of medals'
            },
            // Ajoute un espace (+5) supplémentaire au-dessus de la valeur maximale
            afterDataLimits: (scale: Scale) => {
              scale.max = (scale.max || 0) + 5;
            }
          },
          x: {
            title: {
              display: true,
              text: 'Year'
            }
          }
        }
      }
    };

    if (this.chart) {
      this.chart.destroy();
    }
    
    this.chart = new Chart(ctx, config);
  }
}
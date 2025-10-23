import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { Olympic } from 'src/app/core/models/Olympic';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public olympics$: Observable<Olympic[]> = of([]);
  public errorMessage = '';

  constructor(private olympicService: OlympicService) {}

  ngOnInit(): void {
    // Charge les données initiales depuis le fichier JSON; le service les poussera dans son BehaviorSubject
    this.olympicService.loadInitialData().subscribe({
      next: () => {
        // une fois chargé, on récupère le flux observable de données pour le template
        this.olympics$ = this.olympicService.getOlympics();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Impossible de charger les données';
        // Expose malgrès l'erreur, ce que le service a (probablement un tableau vide)
        this.olympics$ = this.olympicService.getOlympics();
      },
    });
  }
}

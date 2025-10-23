import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Olympic } from '../models/Olympic';

@Injectable({
  providedIn: 'root',
})
export class OlympicService {
  private olympicUrl = './assets/mock/olympic.json';
  private olympics$ = new BehaviorSubject<Olympic[]>([]);

  constructor(private http: HttpClient) {}

  loadInitialData(): Observable<Olympic[]> {
    return this.http.get<Olympic[]>(this.olympicUrl).pipe(
      tap((value) => {
        if (!value || value.length === 0) {
          throw new Error('No Olympic data available');
        }
        this.olympics$.next(value);
      }),
      catchError((error) => {
        console.error('Error loading data:', error);
        // Gérer les différents types d'erreurs
        if (error.status === 404) {
          throw new Error('Data not found. Please check your connection.');
        } else if (error.status === 0) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error('An unexpected error occurred. Please try again later.');
        }
      })
    );
  }

  getOlympics(): Observable<Olympic[]> {
    return this.olympics$.asObservable();
  }

  getCountryById(id: number): Observable<Olympic | undefined> {
    return this.olympics$.pipe(
      map((olympics) => olympics.find((olympic) => olympic.id === id))
    );
  }
}

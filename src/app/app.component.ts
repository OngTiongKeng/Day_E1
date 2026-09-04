import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Link, LinkService } from './link.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly linkService = inject(LinkService);
  readonly links = signal<Link[]>([]);
  readonly url = signal('');
  readonly error = signal('');
  readonly createdLink = signal<Link | null>(null);
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.loadLinks();
  }

  submit(): void {
    const value = this.url().trim();
    if (!/^https?:\/\/\S+$/i.test(value)) {
      this.error.set('Please enter a valid http or https URL.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    this.linkService.create(value).subscribe({
      next: (link) => {
        this.createdLink.set(link);
        this.url.set('');
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (response) => {
        this.error.set(response.error?.error || 'Unable to create the short link.');
        this.submitting.set(false);
      }
    });
  }

  private loadLinks(): void {
    this.linkService.list().subscribe({
      next: (links) => this.links.set(links),
      error: () => this.error.set('Unable to load links. Is the backend running?')
    });
  }
}

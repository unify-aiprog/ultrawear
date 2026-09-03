import Link from 'next/link';
import { getCountries, getSports } from '@/lib/data';

export const revalidate = 300;

export default async function CataloguePage() {
  const [sports, countries] = await Promise.all([getSports(), getCountries()]);

  return (
    <section className="section">
      <p className="eyebrow">THE WORLD OF SPORT</p>
      <h1 className="page-title">GLOBAL<br /><em>CATALOGUE.</em></h1>
      <p className="lede dark">Browse sports, countries, competitions, clubs, national teams, youth sides and players. The catalogue is built to grow far beyond football.</p>

      <div className="catalogue-actions">
        <Link className="button button-dark" href="/teams">Explore teams</Link>
        <Link className="button button-outline" href="/sports">Explore sports</Link>
      </div>

      <div className="catalogue-section">
        <div className="section-heading"><span>01</span><h2>SPORTS</h2></div>
        <div className="index-grid">
          {sports.map((sport) => (
            <Link className="index-card" href="/sports" key={sport.id}>
              <span>SPORT</span><b>{sport.name}</b><small>{sport.description || 'Explore the sporting world.'}</small>
            </Link>
          ))}
        </div>
        {sports.length === 0 && <div className="empty-state">Sports are ready to be seeded when the catalogue database is connected.</div>}
      </div>

      <div className="catalogue-section">
        <div className="section-heading"><span>02</span><h2>COUNTRIES</h2></div>
        <div className="country-grid">
          {countries.map((country) => (
            <div className="country-card" key={country.id}>
              <b>{country.name}</b><small>{country.code || 'Explore'}</small>
            </div>
          ))}
        </div>
        {countries.length === 0 && <div className="empty-state">Country data will populate when the catalogue database is connected.</div>}
      </div>
    </section>
  );
}

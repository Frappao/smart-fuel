begin;

-- Scarica un CSV MIMIT dal server del database.
--
-- Il sito MIMIT rifiuta le connessioni dalle funzioni Vercel (timeout TCP),
-- mentre risponde al database Supabase (AWS Francoforte): il cron giornaliero
-- chiede quindi il file al database quando il download diretto fallisce.
-- Vedi lib/mimit/downloadMimitCsv.ts.
create extension if not exists http with schema extensions;

create or replace function public.fetch_mimit_csv(dataset text)
returns text
language plpgsql
security definer
set search_path = ''
set statement_timeout = '120s'
as $$
declare
  -- Solo i due file ufficiali: la funzione non è un proxy generico.
  target_url constant text := case dataset
    when 'stations' then
      'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv'
    when 'fuel_prices' then
      'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv'
  end;
  response extensions.http_response;
begin
  if target_url is null then
    raise exception 'Unknown MIMIT dataset: %', dataset;
  end if;

  -- Il default dell'estensione è 5 secondi, troppo poco per ~4 MB.
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '60000');

  select * into response
  from extensions.http((
    'GET',
    target_url,
    array[
      extensions.http_header(
        'User-Agent',
        'Mozilla/5.0 (compatible; Rifornio/1.0; +https://rifornio.it)'
      ),
      extensions.http_header('Accept', 'text/csv,text/plain;q=0.9,*/*;q=0.8'),
      extensions.http_header('Accept-Language', 'it-IT,it;q=0.9')
    ],
    null,
    null
  )::extensions.http_request);

  if response.status <> 200 then
    raise exception 'MIMIT download failed with HTTP % for dataset %',
      response.status, dataset;
  end if;

  return response.content;
end;
$$;

-- Funzione interna: richiamabile solo dal backend con la service role.
revoke all on function public.fetch_mimit_csv(text) from public, anon, authenticated;
grant execute on function public.fetch_mimit_csv(text) to service_role;

commit;

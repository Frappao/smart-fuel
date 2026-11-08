export interface CurrentPosition {
  latitude: number
  longitude: number
  accuracy: number
}

// Primo tentativo: GPS/alta precisione (telefoni).
const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
}

// Secondo tentativo: posizione da rete/Wi-Fi. Sui Mac (e su alcuni desktop)
// l'alta precisione fallisce spesso con POSITION_UNAVAILABLE o va in timeout,
// mentre la posizione approssimata è disponibile e basta per i distributori.
const LOW_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 5 * 60_000,
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case 1:
      return 'Accesso alla posizione negato. Consenti la posizione per questo sito nelle impostazioni del browser e riprova.'
    case 2:
      return 'Non è stato possibile determinare la tua posizione. Controlla che i Servizi di localizzazione siano attivi per il browser (su Mac: Impostazioni di Sistema › Privacy e sicurezza › Localizzazione) e che il Wi-Fi sia acceso, poi riprova.'
    case 3:
      return 'La richiesta della posizione ha impiegato troppo tempo. Riprova.'
    default:
      return `Geolocalizzazione non riuscita: ${error.message || 'errore sconosciuto'}`
  }
}

function requestPosition(
  geolocation: Geolocation,
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, options)
  })
}

export async function getCurrentPosition(): Promise<CurrentPosition> {
  if (typeof navigator === 'undefined') {
    throw new Error('La geolocalizzazione è disponibile solo nel browser.')
  }

  if (!navigator.geolocation) {
    throw new Error('La geolocalizzazione non è disponibile in questo browser.')
  }

  const geolocation = navigator.geolocation
  let position: GeolocationPosition

  try {
    position = await requestPosition(geolocation, HIGH_ACCURACY_OPTIONS)
  } catch (firstError) {
    const error = firstError as GeolocationPositionError

    // Permesso negato: un secondo tentativo non cambierebbe nulla.
    if (error?.code === 1) {
      throw new Error(getGeolocationErrorMessage(error))
    }

    try {
      position = await requestPosition(geolocation, LOW_ACCURACY_OPTIONS)
    } catch (secondError) {
      throw new Error(
        getGeolocationErrorMessage(secondError as GeolocationPositionError),
      )
    }
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  }
}

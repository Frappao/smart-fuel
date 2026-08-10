export interface CurrentPosition {
  latitude: number
  longitude: number
  accuracy: number
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case 1:
      return 'Location permission was denied. Allow location access in your browser settings and try again.'
    case 2:
      return 'Your location could not be determined. Check your device location settings and connection, then try again.'
    case 3:
      return 'The location request timed out. Try again.'
    default:
      return `Geolocation failed: ${error.message || 'unknown error'}`
  }
}

export async function getCurrentPosition(): Promise<CurrentPosition> {
  if (typeof navigator === 'undefined') {
    throw new Error('Geolocation is only available in the browser.')
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not available in this browser.')
  }

  return new Promise<CurrentPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        reject(new Error(getGeolocationErrorMessage(error)))
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    )
  })
}

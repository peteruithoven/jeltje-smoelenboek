export interface PhotoState {
  /** Src van de originele (verkleinde) foto: data-URL of server-URL */
  original: string | null
  /** Uitsnede in pixels van het origineel */
  crop: Crop | null
  /** Src van de uitgesneden foto om te tonen */
  preview: string | null
  /** Nieuwe uitgesneden foto (data-URL), alleen als de foto gewijzigd is */
  photo: string | null
}

export interface FormState extends PersonFields {
  consent: boolean
  /** Honeypot: blijft leeg bij mensen */
  website: string
}

export function emptyForm(): FormState {
  return { name: '', roles: [], roleOther: '', repairs: '', about: '', consent: false, website: '' }
}

export function emptyPhoto(): PhotoState {
  return { original: null, crop: null, preview: null, photo: null }
}

/** Bouwt de body voor de API. Stuurt de foto alleen mee als die gewijzigd is. */
export async function toPayload(form: FormState, photo: PhotoState) {
  return {
    ...form,
    photo:
      photo.photo && photo.original && photo.crop
        ? { photo: photo.photo, original: await urlToDataUrl(photo.original), crop: photo.crop }
        : null,
  }
}

/** Haalt een leesbare foutmelding uit een $fetch-fout */
export function errorMessage(error: unknown): string {
  const data = (error as { data?: { message?: string } })?.data
  return data?.message || 'Er ging iets mis. Probeer het later nog eens.'
}

const MIMIT_DATE_TIME_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function daysInMonth(month: number, year: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export function parseMimitDateTime(value: string | null): string | null {
  if (value === null) {
    return null
  }

  const normalizedValue = value.trim()
  const match = MIMIT_DATE_TIME_PATTERN.exec(normalizedValue)

  if (!match) {
    return null
  }

  const [, dayText, monthText, yearText, hourText, minuteText, secondText] =
    match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)

  const isValid =
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(month, year) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59

  if (!isValid) {
    return null
  }

  return `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`
}

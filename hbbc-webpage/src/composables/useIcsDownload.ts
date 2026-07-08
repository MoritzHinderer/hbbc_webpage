const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

interface IcsEvent {
  uid: string
  title: string
  start: Date
  location?: string
  description?: string
}

// Shared by the VfB-Spiele and Fanclub-Termine pages — both just build a
// single-event .ics file and trigger a download for it.
export function downloadIcsEvent(event: IcsEvent) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HBBC//Termine//DE',
    'BEGIN:VEVENT',
    `UID:${event.uid}@hbbc-fanclub.de`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.description ? `DESCRIPTION:${event.description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title.replace(/\s+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

import type { MessageSchema } from '../types'

const de: MessageSchema = {
  nav: {
    ariaLabel: 'Hauptnavigation',
    notes: 'Notizen',
    settings: 'Einstellungen',
  },
  common: {
    buttons: {
      close: 'Schließen',
      cancel: 'Abbrechen',
      save: 'Speichern',
    },
    aria: {
      goBack: 'Zurück',
    },
  },
  quickAdd: {
    open: 'Notiz hinzufügen',
  },
  notes: {
    title: 'Notizen',
    empty: {
      title: 'Noch keine Notizen',
      body: 'Tippe auf +, um deine erste Notiz zu erfassen. Alles bleibt auf diesem Gerät.',
    },
    pinned: 'Angepinnt',
    form: {
      heading: 'Neue Notiz',
      description: 'Lokal gespeichert, offline verfügbar.',
      titleLabel: 'Titel',
      titlePlaceholder: 'Worum geht es?',
      bodyLabel: 'Notiz',
      bodyPlaceholder: 'Schreib es auf…',
    },
    actions: {
      pin: 'Notiz {title} anpinnen',
      unpin: 'Notiz {title} lösen',
      delete: 'Notiz {title} löschen',
    },
    toast: {
      created: 'Notiz gespeichert',
      deleted: 'Notiz gelöscht',
    },
  },
  settings: {
    title: 'Einstellungen',
    appearance: {
      title: 'Darstellung',
      darkMode: 'Dunkler Modus',
    },
    language: {
      title: 'Sprache',
      label: 'App-Sprache',
    },
    data: {
      title: 'Deine Daten',
      description:
        'Alle Daten leben in diesem Browser. Exportiere sie jederzeit — sie gehören dir.',
      export: 'Daten exportieren',
      import: 'Daten importieren',
      importSuccess: 'Daten importiert',
      importError: 'Diese Datei konnte nicht importiert werden',
    },
  },
  pwa: {
    updateAvailable: 'Eine neue Version ist verfügbar',
    reload: 'Neu laden',
    dismiss: 'Update-Hinweis ausblenden',
  },
}

export default de

export default {
  nav: {
    ariaLabel: 'Main navigation',
    notes: 'Notes',
    settings: 'Settings',
  },
  common: {
    buttons: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
    },
    aria: {
      goBack: 'Go back',
    },
  },
  quickAdd: {
    open: 'Add a note',
  },
  notes: {
    title: 'Notes',
    empty: {
      title: 'No notes yet',
      body: 'Tap the + button to capture your first note. Everything stays on this device.',
    },
    pinned: 'Pinned',
    form: {
      heading: 'New note',
      description: 'Saved locally, available offline.',
      titleLabel: 'Title',
      titlePlaceholder: 'What is this about?',
      bodyLabel: 'Note',
      bodyPlaceholder: 'Write it down…',
    },
    actions: {
      pin: 'Pin note {title}',
      unpin: 'Unpin note {title}',
      delete: 'Delete note {title}',
    },
    toast: {
      created: 'Note saved',
      deleted: 'Note deleted',
      loadFailed: 'Your notes could not be loaded',
      saveFailed: 'That note could not be saved',
      deleteFailed: 'That note could not be deleted',
      pinFailed: 'That note could not be updated',
    },
  },
  settings: {
    title: 'Settings',
    appearance: {
      title: 'Appearance',
      darkMode: 'Dark mode',
    },
    language: {
      title: 'Language',
      label: 'App language',
      // This language in its own name — the picker reads it from every
      // catalog, so a translation of it would be wrong here.
      nativeName: 'English',
    },
    data: {
      title: 'Your data',
      description: 'All data lives in this browser. Export it any time — it is yours.',
      export: 'Export data',
      import: 'Import data',
      importSuccess: 'Data imported',
      importError: 'That file could not be imported',
      exportError: 'Your data could not be exported',
    },
  },
  pwa: {
    updateAvailable: 'A new version is available',
    reload: 'Reload',
    dismiss: 'Dismiss update notice',
  },
}

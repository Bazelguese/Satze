/**
 * SATZE · Sondaggio anonimo del playtest
 *
 * Crea nel tuo Google Drive un Google Form già pronto, che non raccoglie email.
 * Come usarlo: vedi README.md in questa cartella (in breve: incolla tutto su
 * script.google.com, scegli la funzione creaSondaggio e premi Esegui).
 *
 * Ogni esecuzione crea un modulo NUOVO: per il ciclo di test successivo cambia
 * VERSIONE qui sotto e rilancia, così le risposte dei due cicli restano separate.
 */

var VERSIONE = '0.1.0';

var ARMATE = [
  "Figli dell'Orizzonte",
  'Kethran',
  'Corte Rossa',
  'Calibri Pesanti',
  'Orathai',
  'Mounthborn',
  "L'Enclave delle Scaglie",
  'Ratti della Megera',
  'Patto degli Indocili',
  'Khemet',
  'Apex',
  'Mascarada',
];

function creaSondaggio() {
  var form = FormApp.create('SATZE · Sondaggio playtest v' + VERSIONE);

  form
    .setDescription(
      'Grazie per aver provato SATZE! Questo sondaggio è ANONIMO: non chiede né nome né email, ' +
        'quindi siate sinceri, anche brutalmente. Ci vogliono 5-10 minuti.\n\n' +
        'Solo poche domande sono obbligatorie: se una cosa non l\'avete provata, saltatela.'
    )
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setProgressBar(true)
    .setConfirmationMessage('Grazie mille! 🃏 Ogni risposta mi aiuta a migliorare il gioco.');

  // ---------- 1. Come hai giocato ----------
  form.addSectionHeaderItem().setTitle('Come hai giocato');

  form
    .addMultipleChoiceItem()
    .setTitle('Quante partite hai giocato, più o meno?')
    .setChoiceValues(['1-2', '3-5', '6-10', 'Più di 10'])
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('Cosa hai provato?')
    .setChoiceValues([
      'Tutorial',
      "Duello contro l'IA",
      '2v2',
      'Re della collina',
      'Multiplayer online',
      'Gestione eserciti (costruire un mazzo)',
      'Galleria',
    ])
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('Nel Duello, quali formati hai provato?')
    .setChoiceValues(['Standard (con Eminenze)', 'No Eminenza', 'Mani nude', 'Non ho giocato Duelli']);

  form
    .addMultipleChoiceItem()
    .setTitle('Quanta esperienza hai con i giochi di carte strategici?')
    .setChoiceValues(['Tanta, ci gioco spesso', 'Un po\'', 'Quasi nessuna']);

  // ---------- 2. Impressioni generali ----------
  form.addPageBreakItem().setTitle('Impressioni generali');

  scala(form, 'Quanto è stato divertente?', 'Per niente', 'Tantissimo', true);
  scala(form, 'Quanto erano chiare le regole?', 'Non ci ho capito niente', 'Chiarissime', true);
  scala(form, 'Dopo il Tutorial sapevi come si gioca?', 'Per niente', 'Sì, del tutto', false,
    'Salta se non hai fatto il Tutorial.');
  scala(form, 'Durante la partita capivi cosa stava succedendo e perché?', 'Quasi mai', 'Sempre', false);
  scala(form, 'Grafica e atmosfera', 'Non mi piacciono', 'Bellissime', false);

  form
    .addMultipleChoiceItem()
    .setTitle("Com'era la difficoltà dell'IA?")
    .setChoiceValues(['Troppo facile', 'Giusta', 'Troppo difficile', 'Non saprei']);

  form
    .addMultipleChoiceItem()
    .setTitle('Le partite ti sono sembrate…')
    .setChoiceValues(['Troppo corte', 'Della durata giusta', 'Troppo lunghe']);

  scala(form, 'Quanta voglia hai di rigiocare?', 'Nessuna', 'Tantissima', true);

  // ---------- 3. Eminenze ----------
  form
    .addPageBreakItem()
    .setTitle('Eminenze')
    .setHelpText('Le Eminenze ci sono nel Duello in formato Standard. Se non le hai provate, vai avanti.');

  scala(form, 'Si capisce cosa fanno le Eminenze?', 'Per niente', 'Benissimo', false);
  scala(form, 'Quanto rendono la partita più interessante?', 'Per niente', 'Moltissimo', false);

  form
    .addMultipleChoiceItem()
    .setTitle('Nel complesso, le Eminenze ti sembrano…')
    .setChoiceValues(['Troppo deboli', 'Equilibrate', 'Troppo forti', 'Alcune troppo forti, altre troppo deboli']);

  form
    .addParagraphTextItem()
    .setTitle("C'è un'Eminenza che ti è sembrata rotta, inutile o geniale? Quale e perché?");

  // ---------- 4. Armate ----------
  form.addPageBreakItem().setTitle('Armate');

  tendina(form, 'La tua armata preferita', ARMATE.concat(['Non ho una preferita']));
  tendina(form, 'Quella che ti è sembrata più forte', ARMATE.concat(['Non saprei']));
  tendina(form, 'Quella che ti è sembrata più debole', ARMATE.concat(['Non saprei']));

  form.addParagraphTextItem().setTitle('Vuoi spiegare perché? (facoltativo)');

  // ---------- 5. In parole tue ----------
  form.addPageBreakItem().setTitle('In parole tue');

  form.addParagraphTextItem().setTitle('Cosa ti è piaciuto di più?');
  form.addParagraphTextItem().setTitle('Cosa ti ha confuso o frustrato di più?');
  form.addParagraphTextItem().setTitle('Se potessi cambiare una sola cosa, quale sarebbe?');

  form
    .addMultipleChoiceItem()
    .setTitle('Hai trovato bug gravi o crash?')
    .setChoiceValues(['No', "Sì, e l'ho segnalato su Discord", 'Sì, ma non l\'ho segnalato']);

  form
    .addScaleItem()
    .setTitle('Quanto consiglieresti SATZE a un amico a cui piacciono i giochi di carte?')
    .setBounds(1, 10)
    .setLabels('Per niente', 'Assolutamente sì');

  form.addParagraphTextItem().setTitle("Vuoi dirmi qualcos'altro?");

  // Google sta cambiando la pubblicazione dei moduli creati da script: se il metodo
  // esiste lo usiamo, altrimenti il modulo è già pubblico come sempre.
  if (typeof form.setPublished === 'function') {
    try {
      form.setPublished(true);
    } catch (e) {
      Logger.log('Nota: non sono riuscito a pubblicare il modulo da qui (' + e + '). Pubblicalo dall\'editor.');
    }
  }

  Logger.log('✔ Sondaggio creato.');
  Logger.log('Link da dare ai playtester: ' + form.getPublishedUrl());
  Logger.log('Link corto: ' + safeShort(form));
  Logger.log('Per modificarlo e vedere le risposte: ' + form.getEditUrl());
}

function scala(form, titolo, sinistra, destra, obbligatoria, aiuto) {
  var item = form.addScaleItem().setTitle(titolo).setBounds(1, 5).setLabels(sinistra, destra);
  if (aiuto) item.setHelpText(aiuto);
  if (obbligatoria) item.setRequired(true);
  return item;
}

function tendina(form, titolo, voci) {
  return form.addListItem().setTitle(titolo).setChoiceValues(voci);
}

function safeShort(form) {
  try {
    return form.shortenFormUrl(form.getPublishedUrl());
  } catch (e) {
    return '(non disponibile: usa quello lungo)';
  }
}

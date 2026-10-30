// Lesson content.
// Step types:
//  info  — explanation with a board (optional highlights, arrows, dice)
//  click — the user must click a spot on the board (target)
//  quiz  — multiple choice question
//  move  — the user plays the given dice; check(state) verifies the result
//          (pass: true if no move is possible at all)
(function (root) {
  const BG = root.BG;
  const { t } = BG;
  const START = { w: { 24: 2, 13: 5, 8: 3, 6: 5 }, b: { 1: 2, 12: 5, 17: 3, 19: 5 } };
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const hl = (pts, color) => pts.map((loc) => ({ loc, color }));
  const W = (st, p) => BG.count(st, p, BG.W);

  const LESSONS = [
    {
      id: 'tabellone',
      title: t('The board', 'Il tabellone'),
      desc: t('The 24 points, the bar and your home board.', 'I 24 punti, la barra e la tua casa.'),
      icon: '▦',
      steps: [
        { type: 'info', board: {}, text: t(
          'Welcome! I\'m your coach and I\'ll teach you <b>backgammon</b> (called <i>tavola reale</i> in Italian) from scratch. Let\'s start with the board: it has <b>24 triangles</b> called <b>points</b>.',
          'Benvenuto! Sono il tuo coach e ti insegnerò il <b>backgammon</b> (in italiano anche <i>tavola reale</i>) da zero. Partiamo dal tabellone: ha <b>24 triangoli</b> chiamati <b>punti</b>.') },
        { type: 'info', board: {}, highlights: hl(range(1, 6)), text: t(
          'The board is split into 4 quarters of 6 points. Bottom right is your <b>home board</b> (points 1–6): in the end you\'ll have to bring all your checkers there.',
          'Il tabellone è diviso in 4 zone da 6 punti. In basso a destra c\'è la tua <b>casa</b> (punti 1–6): alla fine dovrai portare lì tutte le tue pedine.') },
        { type: 'info', board: {}, arrows: [{ from: 1, to: 12 }, { from: 13, to: 24 }], text: t(
          'Points are numbered <b>from your point of view</b>: 1 is bottom right, 12 bottom left, 13 top left and 24 top right. The track is shaped like a <b>horseshoe</b>.',
          'I punti sono numerati <b>dal tuo punto di vista</b>: l\'1 è in basso a destra, il 12 in basso a sinistra, il 13 in alto a sinistra e il 24 in alto a destra. Il percorso è a forma di <b>ferro di cavallo</b>.') },
        { type: 'click', board: {}, target: [6], text: t('Let\'s test you: <b>click point 6</b>.', 'Mettiamoti alla prova: <b>clicca sul punto 6</b>.') },
        { type: 'click', board: {}, target: [13], text: t('Good! Now <b>click point 13</b>.', 'Bene! Ora <b>clicca sul punto 13</b>.') },
        { type: 'click', board: {}, target: [24], text: t('And <b>point 24</b>, the farthest from your home?', 'E il <b>punto 24</b>, il più lontano dalla tua casa?') },
        { type: 'click', board: {}, target: ['bar'], text: t('The vertical strip in the middle is called the <b>bar</b>. Click it.', 'La striscia verticale al centro si chiama <b>barra</b>. Cliccala.') },
        { type: 'info', board: {}, highlights: hl(range(19, 24)).concat([{ loc: 'off', color: 'good' }]), text: t(
          'Top right (points 19–24) is your opponent\'s home board. To the right of the board is the <b>tray</b>, where the checkers you bear off end up.',
          'In alto a destra (punti 19–24) c\'è la casa del tuo avversario. A destra del tabellone c\'è il <b>vassoio</b>, dove finiranno le pedine che fai uscire.') },
      ],
    },
    {
      id: 'obiettivo',
      title: t('Checkers and goal', 'Pedine e obiettivo'),
      desc: t('The starting position and how to win.', 'La posizione iniziale e come si vince.'),
      icon: '◎',
      steps: [
        { type: 'info', board: START, text: t(
          'Each player has <b>15 checkers</b>. You play <b>white</b>, the computer plays <b>black</b>. This is the starting position.',
          'Ogni giocatore ha <b>15 pedine</b>. Tu giochi con le <b>bianche</b>, il computer con le <b>nere</b>. Questa è la posizione iniziale.') },
        { type: 'info', board: START, highlights: hl([24, 13, 8, 6]), text: t(
          'Your checkers start like this: <b>2</b> on point 24, <b>5</b> on 13, <b>3</b> on 8 and <b>5</b> on 6. A trick to remember it: <b>2-5-3-5</b>.',
          'Le tue pedine partono così: <b>2</b> sul punto 24, <b>5</b> sul 13, <b>3</b> sull\'8 e <b>5</b> sul 6. Un trucco per ricordarla: <b>2-5-3-5</b>.') },
        { type: 'info', board: START, arrows: [{ from: 24, to: 13 }, { from: 13, to: 7 }, { from: 6, to: 'off' }], text: t(
          'Your checkers always move <b>towards your home board</b>: from 24 down to 1. Black goes the opposite way, towards its home in the top right.',
          'Le tue pedine si muovono sempre <b>verso la tua casa</b>: dal 24 verso l\'1. Le nere fanno il percorso opposto, verso la loro casa in alto a destra.') },
        { type: 'info', board: START, highlights: hl(range(1, 6)).concat([{ loc: 'off', color: 'good' }]), text: t(
          '<b>Goal of the game:</b> bring all 15 checkers into your home board and then <b>bear them off</b> the board. The first to bear off all their checkers wins!',
          '<b>Obiettivo del gioco:</b> portare tutte le 15 pedine nella tua casa e poi farle <b>uscire</b> dal tabellone. Chi fa uscire per primo tutte le sue pedine vince!') },
        { type: 'quiz', board: START, text: t('Which way do your white checkers move?', 'In quale direzione si muovono le tue pedine bianche?'), options: [
          { t: t('From point 1 to point 24', 'Dal punto 1 verso il punto 24'), why: t('No, that\'s the way black moves.', 'No, quella è la direzione delle nere.') },
          { t: t('From point 24 to point 1', 'Dal punto 24 verso il punto 1'), correct: true, why: t('Right! They always head for your home board.', 'Esatto! Vanno sempre verso la tua casa.') },
          { t: t('Any direction', 'In qualsiasi direzione'), why: t('No: in backgammon you never move backwards.', 'No: nel backgammon non si torna mai indietro.') },
        ] },
        { type: 'quiz', board: START, text: t('How many checkers do you have on point 13 at the start?', 'Quante pedine hai sul punto 13 all\'inizio?'), options: [
          { t: '2', why: t('The 2 checkers are on point 24.', 'Le 2 pedine sono sul punto 24.') },
          { t: '3', why: t('The 3 checkers are on point 8.', 'Le 3 pedine sono sul punto 8.') },
          { t: '5', correct: true, why: t('Correct: 5 on 13 and 5 on 6.', 'Giusto: 5 sul 13 e 5 sul 6.') },
        ] },
        { type: 'click', board: START, target: [24], text: t('Click the point where your <b>2 back checkers</b> are.', 'Clicca sul punto dove si trovano le tue <b>2 pedine più arretrate</b>.') },
      ],
    },
    {
      id: 'dadi',
      title: t('Moving with the dice', 'Muovere con i dadi'),
      desc: t('Each die is a separate move.', 'Ogni dado è una mossa separata.'),
      icon: '⚄',
      steps: [
        { type: 'info', board: { w: { 13: 1 } }, dice: [5, 2], text: t(
          'Each turn you roll <b>two dice</b>. Each die is a move: you move a checker forward by as many points as the die shows.',
          'A ogni turno lanci <b>due dadi</b>. Ogni dado è una mossa: sposti una pedina in avanti di tanti punti quanti ne indica il dado.') },
        { type: 'move', board: { w: { 13: 1 } }, dice: [3, 2], check: (st) => W(st, 8) === 1,
          text: t(
            'You rolled <b>3</b> and <b>2</b>. You have just one checker: move it with one die and then with the other. <br><span class="tip">Click the checker (or drag it), then click a highlighted point.</span>',
            'Hai tirato <b>3</b> e <b>2</b>. Hai una sola pedina: muovila prima di un dado e poi dell\'altro. <br><span class="tip">Clicca la pedina (o trascinala) e poi clicca su un punto evidenziato.</span>'),
          success: t('Exactly: 13 − 3 − 2 = 8. You can use both dice on the <b>same checker</b>.', 'Esatto: 13 − 3 − 2 = 8. Puoi usare entrambi i dadi sulla <b>stessa pedina</b>.') },
        { type: 'move', board: { w: { 13: 2 } }, dice: [4, 2], check: (st) => W(st, 9) === 1 && W(st, 11) === 1,
          text: t('Now use the dice on <b>two different checkers</b>: move one by 4 and the other by 2.', 'Ora usa i dadi su <b>due pedine diverse</b>: muovi una pedina di 4 e l\'altra di 2.'),
          success: t('Perfect! One checker on 9 and one on 11.', 'Perfetto! Una pedina sul 9 e una sull\'11.'),
          fail: t('You moved just one checker. This time use one die per checker.', 'Hai mosso una pedina sola. Questa volta usa un dado per pedina.') },
        { type: 'info', board: START, dice: [3, 1], arrows: [{ from: 8, to: 5 }, { from: 6, to: 5 }], text: t(
          'Moves are written <b>from/to</b>. For example <b>8/5 6/5</b> means: one checker from 8 to 5 and one from 6 to 5.',
          'Le mosse si scrivono <b>partenza/arrivo</b>. Per esempio <b>8/5 6/5</b> significa: una pedina dall\'8 al 5 e una dal 6 al 5.') },
        { type: 'move', board: START, dice: [3, 1], check: (st) => W(st, 5) === 2,
          text: t('Play <b>8/5 6/5</b> with the 3-1.', 'Gioca la mossa <b>8/5 6/5</b> con il 3-1.'),
          success: t(
            'Great! Two checkers on the same point make a <b>point</b>: it\'s safe and blocks your opponent. More on that later.',
            'Ottimo! Due pedine sullo stesso punto formano un <b>punto</b>: è al sicuro e blocca l\'avversario. Ne riparleremo.') },
      ],
    },
    {
      id: 'bloccati',
      title: t('Open and blocked points', 'Punti aperti e bloccati'),
      desc: t('Where you can land and where you can\'t.', 'Dove puoi atterrare e dove no.'),
      icon: '⛔',
      steps: [
        { type: 'info', board: { w: { 13: 1 }, b: { 10: 2, 9: 1 } }, highlights: [{ loc: 10, color: 'bad' }, { loc: 9, color: 'good' }], text: t(
          'You can land on an <b>empty</b> point, a point with <b>your own</b> checkers, or one with <b>a single</b> opposing checker. A point with <b>2 or more</b> opposing checkers is <b>blocked</b>.',
          'Puoi atterrare su un punto <b>vuoto</b>, su un punto con <b>tue pedine</b> o con <b>una sola</b> pedina avversaria. Un punto con <b>2 o più</b> pedine avversarie è <b>bloccato</b>.') },
        { type: 'quiz', board: { w: { 13: 1 }, b: { 10: 2, 9: 1 } }, text: t('With a <b>3</b>, can the checker on 13 go to point 10?', 'Con un <b>3</b>, la pedina sul 13 può andare sul punto 10?'), options: [
          { t: t('Yes', 'Sì'), why: t('No: there are 2 black checkers on 10, the point is blocked.', 'No: sul 10 ci sono 2 pedine nere, il punto è bloccato.') },
          { t: 'No', correct: true, why: t('Right: 2 opposing checkers block the point.', 'Giusto: 2 pedine avversarie bloccano il punto.') },
        ] },
        { type: 'move', board: { w: { 13: 1 }, b: { 10: 2 } }, dice: [5, 3], check: (st) => W(st, 5) === 1,
          text: t(
            'You have <b>5-3</b>. Point 10 is blocked, so you can\'t start with the 3. Bring the checker all the way to point 5!',
            'Hai <b>5-3</b>. Il punto 10 è bloccato, quindi non puoi iniziare con il 3. Porta la pedina fino al punto 5!'),
          success: t(
            'Well done: first the 5 (13/8), then the 3 (8/5). When you use both dice on the same checker, the <b>intermediate point</b> must be open too.',
            'Bravo: prima il 5 (13/8), poi il 3 (8/5). Quando usi due dadi sulla stessa pedina anche il <b>punto intermedio</b> deve essere libero.') },
        { type: 'quiz', text: t('Which of these points <b>can</b> you land on?', 'Su quale di questi punti <b>puoi</b> atterrare?'), board: {}, options: [
          { t: t('A point with 3 black checkers', 'Un punto con 3 pedine nere'), why: t('Blocked: there are 2 or more opposing checkers.', 'Bloccato: ci sono 2 o più pedine avversarie.') },
          { t: t('A point with 1 black checker', 'Un punto con 1 pedina nera'), correct: true, why: t('Yes! And the black checker gets hit (we\'ll see that soon).', 'Sì! E la pedina nera verrà colpita (lo vediamo tra poco).') },
          { t: t('A point with 2 black checkers', 'Un punto con 2 pedine nere'), why: t('Blocked: 2 checkers are enough to block a point.', 'Bloccato: bastano 2 pedine per bloccare un punto.') },
        ] },
      ],
    },
    {
      id: 'doppi',
      title: t('Doubles', 'I doppi'),
      desc: t('Same number on both dice: four moves!', 'Stesso numero sui due dadi: quattro mosse!'),
      icon: '⚅',
      steps: [
        { type: 'info', board: { w: { 13: 2, 8: 2 } }, dice: [2, 2], text: t(
          'If both dice show the same number you rolled a <b>double</b>: you play that number <b>four times</b>! You can split the 4 moves however you like.',
          'Se i due dadi mostrano lo stesso numero hai fatto un <b>doppio</b>: giochi quel numero <b>quattro volte</b>! Puoi distribuire le 4 mosse come vuoi.') },
        { type: 'move', board: { w: { 13: 2, 8: 2 } }, dice: [2, 2], check: () => true,
          text: t('You rolled <b>2-2</b>: you have 4 moves of 2. Play them all, however you like.', 'Hai fatto <b>2-2</b>: hai 4 mosse da 2. Giocale tutte, come preferisci.'),
          success: t('Done! You moved 8 pips in total.', 'Fatto! Hai spostato 8 punti in totale.') },
        { type: 'move', board: START, dice: [6, 6], check: (st) => W(st, 18) === 2 && W(st, 7) === 2,
          text: t(
            'From the starting position, the best move with <b>6-6</b> is <b>24/18(2) 13/7(2)</b>: two checkers from 24 to 18 and two from 13 to 7. Play it!',
            'Nella posizione iniziale, con <b>6-6</b> la mossa migliore è <b>24/18(2) 13/7(2)</b>: due pedine dal 24 al 18 e due dal 13 al 7. Giocala!'),
          success: t('Excellent! The (2) in the notation means the move is played twice.', 'Eccellente! Il (2) nella notazione indica che la mossa è fatta due volte.') },
      ],
    },
    {
      id: 'colpire',
      title: t('Hitting a checker', 'Colpire una pedina'),
      desc: t('Blots and the bar.', 'Le pedine scoperte e la barra.'),
      icon: '✸',
      steps: [
        { type: 'info', board: { w: { 13: 1, 6: 3 }, b: { 9: 1, 19: 3 } }, highlights: hl([9]), text: t(
          'A checker <b>alone</b> on a point is called a <b>blot</b>. It\'s vulnerable!',
          'Una pedina <b>da sola</b> su un punto si chiama <b>pedina scoperta</b> (in inglese <i>blot</i>). È vulnerabile!') },
        { type: 'info', board: { w: { 13: 1, 6: 3 }, b: { 19: 3 }, bar: { b: 1 } }, highlights: hl(['bar']), text: t(
          'If one of your checkers lands on an opposing blot, you <b>hit</b> it: the hit checker goes to the <b>bar</b> and has to start its journey all over again.',
          'Se una tua pedina atterra su una pedina avversaria scoperta, la <b>colpisci</b>: la pedina colpita va sulla <b>barra</b> e dovrà ricominciare il percorso da capo.') },
        { type: 'move', board: { w: { 13: 1, 6: 3 }, b: { 9: 1, 19: 3 } }, dice: [4, 1], check: (st) => st.bar.b === 1,
          text: t('Black left a blot on point 9. <b>Hit it!</b>', 'Le nere hanno lasciato una pedina scoperta sul punto 9. <b>Colpiscila!</b>'),
          success: t('Hit! The black checker is on the bar.', 'Colpita! La pedina nera è sulla barra.'),
          fail: t('You didn\'t hit the checker on 9. Try again!', 'Non hai colpito la pedina sul 9. Riprova!') },
        { type: 'move', board: { w: { 13: 1, 24: 2 }, b: { 5: 1, 19: 3 } }, dice: [6, 2], check: (st) => st.bar.b === 1,
          text: t('Now there\'s a black blot on 5. Hit it using <b>both dice</b> with the same checker.', 'Ora c\'è una pedina nera scoperta sul 5. Colpiscila usando <b>entrambi i dadi</b> con la stessa pedina.'),
          success: t('Perfect: 13/7/5*. The asterisk <b>*</b> in the notation marks a hit.', 'Perfetto: 13/7/5*. L\'asterisco <b>*</b> nella notazione indica un colpo.'),
          fail: t('The checker on 5 is still there. Add up the dice: 6 + 2 = 8.', 'La pedina sul 5 è ancora lì. Somma i dadi: 6 + 2 = 8.') },
        { type: 'info', board: { w: { 8: 1, 6: 2 }, b: { 12: 2 } }, highlights: [{ loc: 8, color: 'bad' }], text: t(
          'Careful: <b>your</b> blots can be hit too! When you can, keep your checkers <b>in pairs</b>, especially near opposing checkers.',
          'Attenzione: anche le <b>tue</b> pedine scoperte possono essere colpite! Quando puoi, tieni le pedine <b>a coppie</b>, soprattutto vicino alle pedine avversarie.') },
      ],
    },
    {
      id: 'barra',
      title: t('Entering from the bar', 'Rientrare dalla barra'),
      desc: t('What to do when you get hit.', 'Cosa fare quando vieni colpito.'),
      icon: '↩',
      steps: [
        { type: 'info', board: { w: { 13: 3 }, b: { 19: 2, 21: 2 }, bar: { w: 1 } }, highlights: hl(['bar']), text: t(
          'If you have a checker on the bar you <b>must bring it back in first</b>, before moving any other checker.',
          'Se hai una pedina sulla barra <b>devi farla rientrare prima</b> di muovere qualsiasi altra pedina.') },
        { type: 'info', board: { w: { 13: 3 }, b: {}, bar: { w: 1 } }, highlights: hl(range(19, 24)), arrows: [{ from: 'bar', to: 22 }], text: t(
          'You enter in your <b>opponent\'s home board</b> (points 24–19): with a 1 on point 24, with a 2 on 23 … with a 6 on 19. Rule: <b>entry point = 25 − die</b>.',
          'Si rientra nella <b>casa dell\'avversario</b> (punti 24–19): con 1 nel punto 24, con 2 nel 23 … con 6 nel 19. Regola: <b>punto di ingresso = 25 − dado</b>.') },
        { type: 'click', board: { w: { 13: 3 }, b: {}, bar: { w: 1 } }, target: [20], text: t('With a <b>5</b>, which point would you enter on? Click it.', 'Con un <b>5</b>, in quale punto rientreresti? Clicca sul punto.') },
        { type: 'move', board: { w: { 13: 3 }, b: { 19: 2, 21: 2 }, bar: { w: 1 } }, dice: [4, 3], check: (st) => st.bar.w === 0,
          text: t(
            'You have a checker on the bar and rolled <b>4-3</b>. Point 21 is blocked: enter with the 3, then play the 4.',
            'Hai una pedina sulla barra e hai tirato <b>4-3</b>. Il punto 21 è bloccato: rientra con il 3 e poi gioca il 4.'),
          success: t('Back in! Only once the bar is clear can you move your other checkers.', 'Rientrata! Solo dopo aver liberato la barra puoi muovere le altre pedine.') },
        { type: 'move', board: { w: { 13: 3 }, b: { 19: 2, 20: 2, 22: 3 }, bar: { w: 1 } }, dice: [6, 5], pass: true,
          text: t(
            'You rolled <b>6-5</b>, but points 19 and 20 are blocked. You can\'t enter, so you can\'t move anything: <b>you lose your turn</b>.',
            'Hai tirato <b>6-5</b>, ma i punti 19 e 20 sono bloccati. Non puoi rientrare e quindi non puoi muovere nulla: <b>perdi il turno</b>.'),
          success: t(
            'Exactly. If the opponent\'s home board is fully closed (6 blocked points) no die lets you in!',
            'Esatto. Se la casa avversaria è chiusa del tutto (6 punti bloccati) non puoi rientrare con nessun dado!') },
      ],
    },
    {
      id: 'obblighi',
      title: t('Dice rules', 'Le regole dei dadi'),
      desc: t('When you must use both dice.', 'Quando devi usare tutti e due i dadi.'),
      icon: '⚖',
      steps: [
        { type: 'info', board: {}, text: t(
          'Three important rules:<br>1. You must <b>use both dice</b>, if possible.<br>2. If you can use <b>only one</b>, you play that one.<br>3. If you can use either one but not both, you must use the <b>higher</b> one.',
          'Tre regole importanti:<br>1. Devi <b>usare entrambi i dadi</b>, se è possibile.<br>2. Se puoi usarne <b>solo uno</b>, giochi quello.<br>3. Se puoi usare l\'uno o l\'altro ma non entrambi, devi usare il <b>più alto</b>.') },
        { type: 'move', board: { w: { 10: 1, 6: 1 }, b: { 4: 2 } }, dice: [4, 2], check: (st) => W(st, 8) === 1 && W(st, 2) === 1,
          text: t(
            'You have <b>4-2</b>. Playing 10/6 looks natural, but then the 2 couldn\'t be used (4 is blocked). Find a way to use <b>both</b> dice.<br><span class="tip">The game only shows you legal moves.</span>',
            'Hai <b>4-2</b>. Giocare 10/6 sembra naturale, ma poi il 2 non si potrebbe usare (il 4 è bloccato). Trova il modo di usare <b>entrambi</b> i dadi.<br><span class="tip">Il gioco ti mostra solo le mosse permesse.</span>'),
          success: t(
            'Exactly: 10/8 6/2. Since there\'s a way to use both dice, you\'re <b>required</b> to do it.',
            'Esatto: 10/8 6/2. Dato che esiste un modo di usare tutti e due i dadi, sei <b>obbligato</b> a farlo.') },
        { type: 'move', board: { w: { 10: 1 }, b: { 4: 2 } }, dice: [4, 2], check: (st) => W(st, 6) === 1,
          text: t(
            'Here with 4-2 you can use <b>only one die</b>, because point 4 is blocked either way. Which one must you use?',
            'Qui con 4-2 puoi usare <b>un solo dado</b>, perché il punto 4 è bloccato in ogni caso. Quale si deve usare?'),
          success: t('Right: when you can use only one of the two dice, you must use the <b>higher</b> one.', 'Giusto: quando puoi usare solo uno dei due dadi, devi usare il <b>più alto</b>.') },
        { type: 'quiz', board: {}, text: t('You can use the 5 or the 3, but not both. What must you do?', 'Puoi usare il 5 oppure il 3, ma non entrambi. Cosa devi fare?'), options: [
          { t: t('Use the 5', 'Usare il 5'), correct: true, why: t('Right: you use the higher die.', 'Giusto: si usa il dado più alto.') },
          { t: t('Use the 3', 'Usare il 3'), why: t('No, the rule says to use the higher die.', 'No, la regola dice di usare il dado più alto.') },
          { t: t('Choose freely', 'Scegliere liberamente'), why: t('No, in this case you must use the higher one.', 'No, in questo caso sei obbligato a usare il più alto.') },
        ] },
      ],
    },
    {
      id: 'uscita',
      title: t('Bearing off', 'Far uscire le pedine'),
      desc: t('The endgame: taking your checkers off.', 'Il finale: portare le pedine fuori.'),
      icon: '⇲',
      steps: [
        { type: 'info', board: { w: { 6: 3, 5: 3, 4: 3, 3: 2, 2: 2, 1: 2 } }, highlights: hl(range(1, 6)), text: t(
          'When <b>all 15</b> of your checkers are in your home board (points 1–6) you can start <b>bearing them off</b>.',
          'Quando <b>tutte e 15</b> le tue pedine sono nella tua casa (punti 1–6) puoi iniziare a farle <b>uscire</b>.') },
        { type: 'info', board: { w: { 6: 3, 5: 3, 4: 3, 3: 2, 2: 2, 1: 2 } }, dice: [6, 4], arrows: [{ from: 6, to: 'off' }, { from: 4, to: 'off' }], text: t(
          'A die bears off a checker from the point with the same number: a 6 from point 6, a 4 from point 4, and so on.',
          'Un dado fa uscire una pedina dal punto con lo stesso numero: con il 6 dal punto 6, con il 4 dal punto 4, e così via.') },
        { type: 'move', board: { w: { 6: 3, 5: 3, 4: 3, 3: 2, 2: 2, 1: 2 } }, dice: [6, 4], check: (st) => st.off.w === 2,
          text: t(
            'You have <b>6-4</b>. Bear off two checkers!<br><span class="tip">Click the checker, then the tray on the right.</span>',
            'Hai <b>6-4</b>. Fai uscire due pedine!<br><span class="tip">Clicca la pedina e poi il vassoio a destra.</span>'),
          success: t(
            'Two checkers off! Remember: you can also use a die to move inside your home board instead of bearing off.',
            'Due pedine fuori! Ricorda: puoi anche usare un dado per muovere dentro casa, invece di uscire.') },
        { type: 'move', board: { w: { 3: 2, 2: 3, 1: 2 }, off: { w: 8 } }, dice: [6, 5], check: (st) => st.off.w === 10,
          text: t(
            'You have <b>6-5</b> but your farthest checker is on point 3. If the die is <b>higher</b> than your highest occupied point, you can bear off from that point. Bear off two checkers!',
            'Hai <b>6-5</b> ma la tua pedina più lontana è sul punto 3. Se il dado è <b>più alto</b> del punto più lontano occupato, puoi far uscire una pedina da quel punto. Fai uscire due pedine!'),
          success: t('Good! With a higher die you bear off from your highest point.', 'Bene! Con un dado più alto esci dal punto più lontano.') },
        { type: 'move', board: { w: { 6: 1, 3: 2 }, off: { w: 12 } }, dice: [5, 2], check: (st) => st.off.w === 13,
          text: t(
            'Careful: if you have checkers on points <b>higher</b> than the die you must move those. You have <b>5-2</b> and a checker on 6: can you still bear one off?',
            'Attenzione: se hai pedine su punti <b>più alti</b> del dado devi muovere quelle. Hai <b>5-2</b> e una pedina sul 6: riesci comunque a far uscire una pedina?'),
          success: t(
            'Clever: 6/4 with the 2, then the 5 bears off the checker from 4, which is now your highest point.',
            'Geniale: 6/4 con il 2, poi il 5 fa uscire la pedina dal 4, che ora è il punto più alto.'),
          fail: t('No checker came off. Try using the 2 first.', 'Nessuna pedina è uscita. Prova a usare prima il 2.') },
        { type: 'info', board: { w: { 5: 2, 3: 3, 2: 2 }, b: { 4: 1 }, bar: { w: 1 }, off: { w: 7 } }, highlights: hl(['bar']), text: t(
          'If one of your checkers gets hit while you\'re bearing off, you must bring it back in and home <b>before</b> you can continue bearing off.',
          'Se mentre fai uscire le pedine una tua pedina viene colpita, dovrai farla rientrare e riportarla a casa <b>prima</b> di poter continuare a uscire.') },
      ],
    },
    {
      id: 'partita',
      title: t('Starting and ending a game', 'Inizio e fine della partita'),
      desc: t('Who goes first, wins, gammons and backgammons.', 'Chi comincia, vittoria, gammon e backgammon.'),
      icon: '🏆',
      steps: [
        { type: 'info', board: START, dice: [], openingDice: [5, 2], text: t(
          '<b>Who goes first?</b> Each player rolls one die: the higher number starts and plays <b>both numbers rolled</b> as the first move. Here you rolled 5 and the computer 2: you start by playing 5-2. On a tie, roll again.',
          '<b>Chi inizia?</b> Ognuno lancia un solo dado: chi fa il numero più alto inizia e gioca come prima mossa <b>i due numeri usciti</b>. Qui tu hai fatto 5 e il computer 2: inizi tu giocando 5-2. Se esce lo stesso numero si rilancia.') },
        { type: 'info', board: { b: { 20: 3, 22: 4, 23: 4, 24: 2 }, off: { w: 15, b: 2 } }, text: t(
          '<b>Single win (1 point):</b> you\'ve borne off all your checkers and your opponent has already borne off at least one.',
          '<b>Vittoria semplice (1 punto):</b> hai fatto uscire tutte le tue pedine e l\'avversario ne ha già fatta uscire almeno una.') },
        { type: 'info', board: { b: { 20: 5, 22: 5, 23: 3, 15: 2 }, off: { w: 15 } }, text: t(
          '<b>Gammon (2 points):</b> you\'ve finished and your opponent hasn\'t borne off <b>any</b> checkers yet.',
          '<b>Gammon (2 punti):</b> hai finito e l\'avversario non ha ancora fatto uscire <b>nessuna</b> pedina.') },
        { type: 'info', board: { b: { 20: 5, 22: 5, 23: 3, 3: 2 }, off: { w: 15 } }, highlights: hl([3]), text: t(
          '<b>Backgammon (3 points):</b> your opponent hasn\'t borne off any checkers and still has some on the <b>bar</b> or in <b>your home board</b>.',
          '<b>Backgammon (3 punti):</b> l\'avversario non ha fatto uscire nessuna pedina e ne ha ancora sulla <b>barra</b> o nella <b>tua casa</b>.') },
        { type: 'quiz', board: { b: { 20: 5, 22: 4, 23: 3, 2: 2 }, bar: { b: 1 }, off: { w: 15 } }, text: t('You just bore off your last checker. What kind of win is it?', 'Hai appena fatto uscire l\'ultima pedina. Che tipo di vittoria è?'), options: [
          { t: t('Single win', 'Vittoria semplice'), why: t('No: black hasn\'t borne off any checkers yet.', 'No: le nere non hanno ancora fatto uscire nessuna pedina.') },
          { t: 'Gammon', why: t('Almost! But there are black checkers in your home board and on the bar.', 'Quasi! Ma ci sono pedine nere nella tua casa e sulla barra.') },
          { t: 'Backgammon', correct: true, why: t('Exactly: 3 points!', 'Esatto: 3 punti!') },
        ] },
        { type: 'quiz', board: {}, text: t('You won and your opponent had already borne off 4 checkers. How many points do you win?', 'Hai vinto e l\'avversario aveva già fatto uscire 4 pedine. Quanti punti vinci?'), options: [
          { t: t('1 point', '1 punto'), correct: true, why: t('Right: a single win.', 'Giusto: vittoria semplice.') },
          { t: t('2 points', '2 punti'), why: t('No: for a gammon your opponent must not have borne off any checkers.', 'No: per il gammon l\'avversario non deve aver fatto uscire nessuna pedina.') },
          { t: t('3 points', '3 punti'), why: t('No, a backgammon requires your opponent to have borne off no checkers.', 'No, il backgammon richiede che l\'avversario non abbia fatto uscire nessuna pedina.') },
        ] },
        { type: 'info', board: {}, text: t(
          '<b>The doubling cube.</b> In tournaments a special die (2, 4, 8, 16, 32, 64) is used to double the stakes during the game. You don\'t need it to learn: we won\'t use it in our games.',
          '<b>Il cubo del raddoppio.</b> Nei tornei si usa un dado speciale (2, 4, 8, 16, 32, 64) per raddoppiare la posta durante la partita. Per imparare non serve: nelle nostre partite non lo useremo.') },
      ],
    },
    {
      id: 'consigli',
      title: t('First tips', 'Primi consigli'),
      desc: t('Four simple ideas to play better.', 'Quattro idee semplici per giocare meglio.'),
      icon: '★',
      steps: [
        { type: 'info', board: START, text: t('You know all the rules! 🎉 Now four simple tips so you don\'t play at random.', 'Conosci tutte le regole! 🎉 Ora quattro consigli semplici per non giocare a caso.') },
        { type: 'info', board: { w: { 24: 2, 13: 4, 8: 2, 7: 2, 6: 3, 5: 2 }, b: START.b }, highlights: hl([7, 6, 5]), text: t(
          '<b>1. Make points</b> in your home board and just in front of it (the best are 5, 4 and 7): they make it hard for your opponent to enter and move forward.',
          '<b>1. Costruisci punti</b> nella tua casa e subito davanti (i migliori sono il 5, il 4 e il 7): rendono difficile all\'avversario rientrare e avanzare.') },
        { type: 'move', board: START, dice: [4, 2], check: (st) => W(st, 4) === 2,
          text: t('With an opening <b>4-2</b> you can make the <b>4-point</b>. Do it!', 'Con <b>4-2</b> all\'inizio puoi costruire il <b>punto 4</b>. Fallo!'),
          success: t('Perfect: 8/4 6/4 is the classic 4-2 opening.', 'Perfetto: 8/4 6/4 è la mossa classica con 4-2.'),
          fail: t('You didn\'t make the 4-point. Which checkers reach 4 with a 4 and with a 2?', 'Non hai costruito il punto 4. Quali pedine arrivano sul 4 con un 4 e con un 2?') },
        { type: 'info', board: { w: { 24: 2, 13: 4, 9: 1, 8: 2, 6: 6 }, b: START.b }, highlights: [{ loc: 9, color: 'bad' }], text: t(
          '<b>2. Avoid blots</b> within your opponent\'s reach: if you get hit you lose a lot of ground.',
          '<b>2. Evita le pedine scoperte</b> a tiro dell\'avversario: se ti colpisce perdi molta strada.') },
        { type: 'move', board: START, dice: [6, 5], check: (st) => W(st, 24) === 1 && W(st, 13) === 6,
          text: t(
            '<b>3. Escape your back checkers.</b> With an opening <b>6-5</b> the classic move is to run one checker from 24 all the way to 13: <b>24/13</b>.',
            '<b>3. Fai scappare le pedine arretrate.</b> Con <b>6-5</b> all\'inizio la mossa classica è portare una pedina dal 24 fino al 13: <b>24/13</b>.'),
          success: t('Great! The checker is now safe with the others on 13.', 'Ottimo! La pedina è passata al sicuro con le altre sul 13.') },
        { type: 'info', board: { w: { 6: 4, 5: 4, 4: 3, 3: 2, 2: 2 }, b: { 19: 4, 20: 4, 21: 3, 23: 3, 24: 1 } }, text: t(
          '<b>4. The race:</b> when the checkers can no longer touch, it\'s a <b>race</b>. Move forward, bring everything home and bear off as soon as possible. The <b>pip count</b> (the total distance you still have to cover) tells you who\'s ahead: you see it next to the players\' names.',
          '<b>4. Corsa:</b> quando le pedine non possono più toccarsi è una <b>corsa</b>. Muovi in avanti, porta tutto a casa e fai uscire le pedine il prima possibile. Il <b>conteggio dei pip</b> (la somma dei punti che ti mancano) ti dice chi è in vantaggio: lo vedi accanto ai nomi dei giocatori.') },
        { type: 'info', board: START, text: t(
          'You\'re ready to play a full game! Go to <b>Play</b> and challenge the computer: the coach will rate your moves and you can ask for a <b>hint</b> whenever you\'re unsure.',
          'Sei pronto per giocare una partita completa! Vai su <b>Gioca</b> e sfida il computer: il coach valuterà le tue mosse e potrai chiedere un <b>suggerimento</b> quando sei in dubbio.'), cta: true },
      ],
    },
  ];

  BG.LESSONS = LESSONS;
})(window);

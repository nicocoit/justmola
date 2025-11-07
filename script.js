document.addEventListener('DOMContentLoaded', () => {
    // 1. Definisci le opzioni e la mappa delle immagini
    const options = {
        'maglia': ['bianca', 'nera', 'rosa'],
        'pantaloncini': ['bianchi', 'neri', 'blu'],
        'calzettoni': ['bianchi', 'neri', 'blu']
    };

    const imageMap = {
        'maglia': { 'bianca': 'mw.png', 'nera': 'mn.png', 'rosa': 'mr.png' },
        'pantaloncini': { 'bianchi': 'pw.png', 'neri': 'pn.png', 'blu': 'pb.png' },
        'calzettoni': { 'bianchi': 'cw.png', 'neri': 'cn.png', 'blu': 'cb.png' }
    };

    // 2. Stato corrente del configuratore
    const currentIndices = {
        'maglia': 0, 
        'pantaloncini': 0, 
        'calzettoni': 0
    };

    // Variabili per la gestione del touch (swipe)
    let touchStartX = 0;
    let touchStartY = 0; // Nuova variabile per l'asse Y
    const SWIPE_THRESHOLD = 50; 
    const DIRECTION_THRESHOLD = 10; // Soglia per determinare se il movimento è orizzontale o verticale

    // 3. Riferimenti agli elementi DOM (AGGIORNATI)
    const imgMaglia = document.getElementById('img-maglia');
    const imgPantaloncini = document.getElementById('img-pantaloncini');
    const imgCalzettoni = document.getElementById('img-calzettoni');

    const kitImagesContainer = document.getElementById('kit-images');
    const exportButton = document.getElementById('export-button');

    const formatPopup = document.getElementById('format-selection-popup');
    const confirmFormatButton = document.getElementById('confirm-format-button');
    const cancelFormatButton = document.getElementById('cancel-format-button');

    const kitPieceWrappers = document.querySelectorAll('.kit-piece-wrapper');

    const elementMap = {
        'maglia': { img: imgMaglia },
        'pantaloncini': { img: imgPantaloncini },
        'calzettoni': { img: imgCalzettoni }
    };

    // 4. Funzione per aggiornare l'immagine
    function updateKitPiece(type) {
        const index = currentIndices[type];
        const value = options[type][index]; 
        const filename = imageMap[type][value];
        
        const { img } = elementMap[type];

        // Aggiorna l'immagine e l'alt text
        img.src = filename;
        img.alt = `${type} ${value}`;
    }

    // --- SEZIONE CHIAVE: GESTIONE SCORRIMENTO (Click e Swipe) ---

    // Funzione unificata per cambiare l'indice
    function changeIndex(type, direction) {
        const numOptions = options[type].length;
        let currentIndex = currentIndices[type];

        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % numOptions;
        } else if (direction === 'prev') {
            // Aggiungiamo numOptions prima del modulo per gestire i valori negativi in JavaScript
            currentIndex = (currentIndex - 1 + numOptions) % numOptions;
        }

        currentIndices[type] = currentIndex;
        updateKitPiece(type);
    }
    
    // 5a. Gestore per i pulsanti di scorrimento (Click)
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            const direction = button.dataset.direction;
            changeIndex(type, direction);
        });
    });

    // 5b. Gestore per il Trascinamento (Swipe)
    kitPieceWrappers.forEach(wrapper => {
        const type = wrapper.dataset.type;

        wrapper.addEventListener('touchstart', (e) => {
            // Registra la posizione iniziale di X e Y
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        wrapper.addEventListener('touchmove', (e) => {
            const touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            
            const diffX = Math.abs(touchStartX - touchCurrentX);
            const diffY = Math.abs(touchStartY - touchCurrentY);

            // Se il movimento orizzontale è significativamente maggiore di quello verticale, 
            // intercettiamo l'evento come swipe.
            if (diffX > diffY && diffX > DIRECTION_THRESHOLD) {
                e.preventDefault(); // Blocca lo scorrimento verticale della pagina
            }
            // Altrimenti, lasciamo che l'azione predefinita (scorrimento verticale) avvenga.
        }, { passive: false }); // Deve essere false per usare preventDefault

        wrapper.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            // La logica si concentra solo sull'asse X per determinare lo swipe
            const diff = touchStartX - touchEndX; 

            if (Math.abs(diff) > SWIPE_THRESHOLD) {
                // È uno swipe orizzontale valido
                if (diff > 0) {
                    // Swipe a sinistra (passa al successivo)
                    changeIndex(type, 'next');
                } else {
                    // Swipe a destra (passa al precedente)
                    changeIndex(type, 'prev');
                }
            }
            touchStartX = 0; // Resetta la posizione
            touchStartY = 0;
        });
    });

    // --- FINE GESTIONE SCORRIMENTO ---

    // 6. Logica di Esportazione (AGGIORNATA con Popup Radio Button)
    exportButton.addEventListener('click', async () => {
        // 1. Nascondi i pulsanti di navigazione
        document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'hidden');

        // 2. Cattura l'immagine (avviene subito per evitare ritardi)
        const captureOptions = {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff'
        };

        const kitImagesOnly = document.querySelector('#kit-images'); 
        const canvas = await html2canvas(kitImagesOnly, captureOptions);
        const imgData = canvas.toDataURL('image/png');

        // 3. Mostra il popup di selezione formato
        formatPopup.classList.remove('hidden');

        // 4. Blocca l'esecuzione finché l'utente non seleziona un formato (uso della Promise)
        const format = await new Promise(resolve => {
            
            // Listener per la conferma
            confirmFormatButton.onclick = () => {
                const selectedFormat = document.querySelector('input[name="export-format"]:checked').value;
                formatPopup.classList.add('hidden'); // Nasconde il popup
                resolve(selectedFormat);
            };
            
            // Listener per l'annullamento
            cancelFormatButton.onclick = () => {
                formatPopup.classList.add('hidden'); // Nasconde il popup
                resolve(null); // Risolve a null per annullare l'esportazione
            };
        });

        // 5. Ripristina la visibilità dei pulsanti di navigazione
        document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'visible');

        // 6. Esegue l'esportazione
        if (format === 'jpg') {
            const jpegData = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = jpegData;
            link.download = 'completo-sportivo.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const imgWidth = 190;
            const pageHeight = doc.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            const x = 10;
            const y = (pageHeight - imgHeight) / 2;
            
            doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            doc.save('completo-sportivo.pdf');
        } 
        // Se 'format' è null (annullato), non facciamo nulla.
    });

    // 7. Inizializzazione
    function initializeKit() {
        updateKitPiece('maglia');
        updateKitPiece('pantaloncini');
        updateKitPiece('calzettoni');
    }

    initializeKit();
});
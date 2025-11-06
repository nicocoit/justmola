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
    const SWIPE_THRESHOLD = 50; // Distanza minima in pixel per considerare il movimento come swipe

    // 3. Riferimenti agli elementi DOM
    const imgMaglia = document.getElementById('img-maglia');
    const imgPantaloncini = document.getElementById('img-pantaloncini');
    const imgCalzettoni = document.getElementById('img-calzettoni');

    const kitImagesContainer = document.getElementById('kit-images');
    const exportButton = document.getElementById('export-button');

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
            // Registra la posizione iniziale del tocco
            touchStartX = e.touches[0].clientX;
        }, { passive: true }); // passive: true per ottimizzazione mobile

        wrapper.addEventListener('touchmove', (e) => {
            // Impedisce lo scorrimento verticale della pagina durante lo swipe orizzontale
            e.preventDefault(); 
        }, { passive: false });

        wrapper.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX; // Calcola la differenza orizzontale

            if (Math.abs(diff) > SWIPE_THRESHOLD) {
                // È uno swipe valido
                if (diff > 0) {
                    // Swipe a sinistra (passa al successivo)
                    changeIndex(type, 'next');
                } else {
                    // Swipe a destra (passa al precedente)
                    changeIndex(type, 'prev');
                }
            }
            touchStartX = 0; // Resetta la posizione
        });
    });

    // --- FINE GESTIONE SCORRIMENTO ---

    // 6. Logica di Esportazione (NON MODIFICATA)
    exportButton.addEventListener('click', async () => {
        document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'hidden');

        const captureOptions = {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff'
        };

        const kitImagesOnly = document.querySelector('#kit-images'); 
        const canvas = await html2canvas(kitImagesOnly, captureOptions);
        const imgData = canvas.toDataURL('image/png');

        document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'visible');

        const format = prompt("Vuoi esportare come JPG o PDF? Scrivi 'jpg' o 'pdf'.", "jpg");

        if (format && format.toLowerCase() === 'jpg') {
            const jpegData = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = jpegData;
            link.download = 'completo-sportivo.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format && format.toLowerCase() === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const imgWidth = 190;
            const pageHeight = doc.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            const x = 10;
            const y = (pageHeight - imgHeight) / 2;
            
            doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            doc.save('completo-sportivo.pdf');
        } else {
            alert('Formato non riconosciuto. Esportazione annullata.');
        }
    });

    // 7. Inizializzazione
    function initializeKit() {
        updateKitPiece('maglia');
        updateKitPiece('pantaloncini');
        updateKitPiece('calzettoni');
    }

    initializeKit();
});
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Definisci le variabili iniziali
    let kitPaths = {}; // Qui verranno caricati i dati dal config.json
    
    // 2. Stato corrente del configuratore
    const currentIndices = {
        'maglia': 0, 
        'pantaloncini': 0, 
        'calzettoni': 0
    };

    // Variabili per la gestione del touch (swipe)
    let touchStartX = 0;
    let touchStartY = 0; 
    const SWIPE_THRESHOLD = 50; 
    const DIRECTION_THRESHOLD = 10; 

    // 3. Riferimenti agli elementi DOM (AGGIUNTI quelli del popup)
    const imgMaglia = document.getElementById('img-maglia');
    const imgPantaloncini = document.getElementById('img-pantaloncini');
    const imgCalzettoni = document.getElementById('img-calzettoni');

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

    // 4. Funzione per aggiornare l'immagine (USA kitPaths)
    function updateKitPiece(type) {
        // Controllo per assicurarsi che i dati siano caricati
        if (!kitPaths[type] || kitPaths[type].length === 0) return;
        
        const index = currentIndices[type];
        const filename = kitPaths[type][index]; 
        
        const { img } = elementMap[type];

        img.src = filename;
        // Alt text derivato dal nome del file
        const altName = filename.split('/').pop().replace(/_/g, ' ').replace(/\.png/i, '');
        img.alt = altName;
    }

    // 5. Funzione unificata per cambiare l'indice (USA kitPaths)
    function changeIndex(type, direction) {
        if (!kitPaths[type] || kitPaths[type].length === 0) return;

        const numOptions = kitPaths[type].length; 
        let currentIndex = currentIndices[type];

        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % numOptions;
        } else if (direction === 'prev') {
            currentIndex = (currentIndex - 1 + numOptions) % numOptions;
        }

        currentIndices[type] = currentIndex;
        updateKitPiece(type);
    }

    // 6. Logica di Inizializzazione (Ora chiamata dopo il caricamento JSON)
    function initializeKit() {
        setupEventListeners();

        updateKitPiece('maglia');
        updateKitPiece('pantaloncini');
        updateKitPiece('calzettoni');
    }

    // 7. Configurazione degli Event Listeners
    function setupEventListeners() {
        // 7a. Click sui pulsanti
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                const direction = button.dataset.direction;
                changeIndex(type, direction);
            });
        });

        // 7b. Trascinamento (Swipe)
        kitPieceWrappers.forEach(wrapper => {
            const type = wrapper.dataset.type;

            wrapper.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            wrapper.addEventListener('touchmove', (e) => {
                const touchCurrentX = e.touches[0].clientX;
                const touchCurrentY = e.touches[0].clientY;
                
                const diffX = Math.abs(touchStartX - touchCurrentX);
                const diffY = Math.abs(touchStartY - touchCurrentY);

                if (diffX > diffY && diffX > DIRECTION_THRESHOLD) {
                    e.preventDefault(); 
                }
            }, { passive: false });

            wrapper.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX; 

                if (Math.abs(diff) > SWIPE_THRESHOLD) {
                    if (diff > 0) {
                        changeIndex(type, 'next');
                    } else {
                        changeIndex(type, 'prev');
                    }
                }
                touchStartX = 0; 
                touchStartY = 0;
            });
        });

        // 7c. Esportazione (CON POPUP RADIO BUTTON E PDF FIXED)
        exportButton.addEventListener('click', async () => {
            // 1. Nascondi i pulsanti di navigazione
            document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'hidden');

            // 2. Cattura l'immagine (avviene subito)
            const captureOptions = { scale: 2, useCORS: true, backgroundColor: '#ffffff' };
            const kitImagesOnly = document.querySelector('#kit-images'); 
            const canvas = await html2canvas(kitImagesOnly, captureOptions);
            const imgData = canvas.toDataURL('image/png');

            // 3. Mostra il popup di selezione formato
            formatPopup.classList.remove('hidden');

            // 4. Blocca l'esecuzione finché l'utente non seleziona un formato
            const format = await new Promise(resolve => {
                
                confirmFormatButton.onclick = () => {
                    const selectedFormat = document.querySelector('input[name="export-format"]:checked').value;
                    formatPopup.classList.add('hidden');
                    resolve(selectedFormat);
                };
                
                cancelFormatButton.onclick = () => {
                    formatPopup.classList.add('hidden');
                    resolve(null);
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
                const doc = new jsPDF('p', 'mm', 'a4'); // Orientamento Portrait (Verticale)
                
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                // Larghezza target (Pagina - 20mm di margine)
                const targetWidth = pageWidth - 20; 
                
                // Calcola l'altezza mantenendo le proporzioni
                const targetHeight = (canvas.height * targetWidth) / canvas.width;

                let finalX = 10;
                let finalY = 10;
                let drawHeight = targetHeight;
                let drawWidth = targetWidth;

                // Se l'altezza calcolata è troppo grande per la pagina (il nostro caso)
                if (targetHeight > pageHeight - 20) {
                    // Ricalcola in base all'altezza massima (Lasciamo 20mm di margine totale)
                    drawHeight = pageHeight - 20; 
                    drawWidth = (canvas.width * drawHeight) / canvas.height; 
                    
                    // Centra orizzontalmente la nuova larghezza e allinea in alto
                    finalX = (pageWidth - drawWidth) / 2;
                    finalY = 10; 
                } else {
                    // Altrimenti, centra verticalmente
                    finalY = (pageHeight - targetHeight) / 2;
                }

                // Inserisci l'immagine con le dimensioni finali calcolate
                doc.addImage(imgData, 'PNG', finalX, finalY, drawWidth, drawHeight);
                doc.save('completo-sportivo.pdf');
            } 
        });
    }

    // 8. FUNZIONE PRINCIPALE: Caricamento del file JSON
    async function loadConfiguration() {
        try {
            // Usa una funzione per ottenere il percorso base del sito su GitHub Pages
            function getBasePath() {
                // Esempio: "https://nicocoit.github.io/justmola/index.html" -> "/repo-name/"
                const path = window.location.pathname;
                // La funzione cerca il nome della repository e lo usa come base
                const repoName = path.split('/')[1]; 
                // Restituisce '/repo-name/' o '/' se non c'è una repository (es. dominio personalizzato)
                return repoName ? `/${repoName}/` : '/';
            }

            const basePath = getBasePath();
            // Tenta di caricare il file JSON usando il percorso assoluto
            const configUrl = `${basePath}config.json`;

            console.log(`Tentativo di caricamento da: ${configUrl}`);

            const response = await fetch(configUrl);
            if (!response.ok) {
                // Se fallisce, tenta come fallback il percorso relativo
                const fallbackResponse = await fetch('config.json');
                if (!fallbackResponse.ok) {
                    throw new Error(`Impossibile caricare config.json da entrambi i percorsi. Stato: ${response.status}`);
                }
                kitPaths = await fallbackResponse.json();

            } else {
                 kitPaths = await response.json();
            }
            
            console.log("Configurazione JSON caricata con successo.");
            // Avvia l'interfaccia solo dopo che i dati sono stati caricati
            initializeKit();

        } catch (error) {
            console.error("ERRORE FATALE: Il configuratore non è riuscito ad avviarsi. Controlla il file config.json sul server.", error);
            // Mostra un messaggio di errore all'utente se il caricamento fallisce
            alert("ERRORE: Impossibile caricare la configurazione. Il file 'config.json' non è accessibile. Controlla la console per i dettagli.");
        }
    }

    // Esegui il caricamento all'avvio
    loadConfiguration();
});
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

    // 2. Stato corrente del configuratore (indice dell'opzione selezionata)
    const currentIndices = {
        'maglia': 0, // Inizia con la prima opzione (bianca)
        'pantaloncini': 0, // Inizia con la prima opzione (bianchi)
        'calzettoni': 0 // Inizia con la prima opzione (bianchi)
    };

    // 3. Riferimenti agli elementi DOM
    const imgMaglia = document.getElementById('img-maglia');
    const imgPantaloncini = document.getElementById('img-pantaloncini');
    const imgCalzettoni = document.getElementById('img-calzettoni');

    const kitImagesContainer = document.getElementById('kit-images');
    const exportButton = document.getElementById('export-button');

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

    // 5. Gestore per i pulsanti di scorrimento (nav-button)
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const type = event.target.dataset.type || event.target.closest('.nav-button').dataset.type; // Gestisce click sull'immagine o sul pulsante
            const direction = event.target.dataset.direction || event.target.closest('.nav-button').dataset.direction;
            
            const numOptions = options[type].length;
            let currentIndex = currentIndices[type];

            if (direction === 'next') {
                // Ciclo in avanti
                currentIndex = (currentIndex + 1) % numOptions;
            } else if (direction === 'prev') {
                // Ciclo all'indietro
                currentIndex = (currentIndex - 1 + numOptions) % numOptions;
            }

            currentIndices[type] = currentIndex;
            updateKitPiece(type);
        });
    });

    // 6. Logica di Esportazione
    exportButton.addEventListener('click', async () => {
        // Nascondi i pulsanti per una cattura pulita
        document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'hidden');

        // Cattura l'immagine
        const captureOptions = {
            scale: 2, // Cattura ad alta risoluzione per una migliore qualità
            useCORS: true, 
            backgroundColor: '#ffffff'
        };

        const kitImagesOnly = document.querySelector('#kit-images'); 
        const canvas = await html2canvas(kitImagesOnly, captureOptions);
        const imgData = canvas.toDataURL('image/png');

        // Ripristina la visibilità dei pulsanti
        document.querySelectorAll('.nav-button').forEach(btn => btn.style.visibility = 'visible');

        // Chiedi il formato e scarica
        //const format = prompt("Vuoi esportare come JPG o PDF? Scrivi 'jpg' o 'pdf'.", "jpg");
        const format = 'jpg';

        if (format && format.toLowerCase() === 'jpg') {
            // Esportazione JPG
            const jpegData = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = jpegData;
            link.download = 'completo-sportivo.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format && format.toLowerCase() === 'pdf') {
            // Esportazione PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Calcolo delle dimensioni per adattare l'immagine al PDF
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

    // 7. Inizializzazione: Assicura che le immagini di default siano caricate
    function initializeKit() {
        updateKitPiece('maglia');
        updateKitPiece('pantaloncini');
        updateKitPiece('calzettoni');
    }

    initializeKit();
});
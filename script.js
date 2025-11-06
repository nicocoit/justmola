document.addEventListener('DOMContentLoaded', () => {
    // 1. Mappatura dei valori delle opzioni ai nomi dei file immagine (RESTANO UGUALI)
    const imageMap = {
        'maglia': {
            'bianca': 'mw.png',
            'nera': 'mn.png',
            'rosa': 'mr.png'
        },
        'pantaloncini': {
            'bianchi': 'pw.png',
            'neri': 'pn.png',
            'blu': 'pb.png'
        },
        'calzettoni': {
            'bianchi': 'cw.png',
            'neri': 'cn.png',
            'blu': 'cb.png'
        }
    };

    // 2. Riferimenti agli elementi DOM (AGGIUNGI IL PULSANTE)
    const magliaSelect = document.getElementById('maglia');
    const pantalonciniSelect = document.getElementById('pantaloncini');
    const calzettoniSelect = document.getElementById('calzettoni');

    const imgMaglia = document.getElementById('img-maglia');
    const imgPantaloncini = document.getElementById('img-pantaloncini');
    const imgCalzettoni = document.getElementById('img-calzettoni');

    const kitImagesContainer = document.getElementById('kit-images'); // Il div che contiene le immagini del kit
    const exportButton = document.getElementById('export-button'); // Il nuovo pulsante

    // 3. Funzione per aggiornare l'immagine (RESTA UGUALE)
    function updateKit(type, value) {
        let imgElement;
        
        if (type === 'maglia') {
            imgElement = imgMaglia;
        } else if (type === 'pantaloncini') {
            imgElement = imgPantaloncini;
        } else if (type === 'calzettoni') {
            imgElement = imgCalzettoni;
        } else {
            return;
        }

        const filename = imageMap[type][value];
        
        if (filename) {
            imgElement.src = filename;
            imgElement.alt = `${type} ${value}`;
        }
    }

    // 4. Gestori di eventi (AGGIUNGI IL GESTORE PER IL PULSANTE DI ESPORTAZIONE)
    
    function handleSelectionChange(event) {
        const selectElement = event.target;
        const type = selectElement.id;
        const value = selectElement.value;
        
        updateKit(type, value);
    }

    magliaSelect.addEventListener('change', handleSelectionChange);
    pantalonciniSelect.addEventListener('change', handleSelectionChange);
    calzettoniSelect.addEventListener('change', handleSelectionChange);

    // Gestore per il pulsante di esportazione
    exportButton.addEventListener('click', async () => {
        // Opzioni per html2canvas (puoi aggiustarle)
        const options = {
            scale: 2, // Aumenta la risoluzione per una migliore qualità
            useCORS: true, // Importante se le immagini provengono da un dominio diverso
            backgroundColor: '#ffffff' // Sfondo bianco per il canvas
        };

        // Cattura il contenuto del div 'kit-images' come canvas
        const canvas = await html2canvas(kitImagesContainer, options);
        const imgData = canvas.toDataURL('image/png'); // Ottieni i dati dell'immagine in formato PNG

        // Chiedi all'utente il formato di esportazione
        //const format = prompt("Vuoi esportare come JPG o PDF? Scrivi 'jpg' o 'pdf'.", "pdf");
	
	format = 'jpg';
        if (format && format.toLowerCase() === 'jpg') {
            // Scarica come JPG
            const jpegData = canvas.toDataURL('image/jpeg', 0.9); // 0.9 è la qualità
            const link = document.createElement('a');
            link.href = jpegData;
            link.download = 'completo-sportivo.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format && format.toLowerCase() === 'pdf') {
            // Scarica come PDF
            const { jsPDF } = window.jspdf; // Ottieni l'oggetto jsPDF dalla finestra
            const doc = new jsPDF();
            
            // Calcola le dimensioni per adattare l'immagine alla pagina PDF
            const imgWidth = 190; // Larghezza desiderata per l'immagine nel PDF (mm)
            const pageHeight = doc.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Se l'altezza supera la pagina, centra o ridimensiona ulteriormente
            const x = 10; // Margine sinistro
            const y = (pageHeight - imgHeight) / 2; // Centra verticalmente
            
            doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            doc.save('completo-sportivo.pdf');
        } else {
            alert('Formato non riconosciuto. Esportazione annullata.');
        }
    });

    // 5. Inizializzazione: Assicura che il completo iniziale sia corretto al caricamento
    function initializeKit() {
        updateKit('maglia', magliaSelect.value);
        updateKit('pantaloncini', pantalonciniSelect.value);
        updateKit('calzettoni', calzettoniSelect.value);
    }

    initializeKit();
});
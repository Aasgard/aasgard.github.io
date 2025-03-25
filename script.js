class BarcodeScanner {
    constructor() {
        this.scannerActive = false;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.resultDiv = document.getElementById('result');
        this.loadingDiv = document.getElementById('loading');
        this.productInfo = document.getElementById('product-info');
        this.scanAgainButton = document.getElementById('scan-again');
        this.productName = document.getElementById('product-name');
        this.productBrand = document.getElementById('product-brand');
        this.nutritionList = document.getElementById('nutrition-list');
        this.ingredientsText = document.getElementById('ingredients-text');
    }

    initializeEventListeners() {
        this.scanAgainButton.addEventListener('click', () => this.startScanner());
        this.startScanner();
    }

    startScanner() {
        this.resultDiv.classList.add('hidden');
        this.scannerActive = true;

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector("#interactive"),
                constraints: {
                    facingMode: "environment"
                },
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
            }
        }, (err) => {
            if (err) {
                console.error(err);
                alert("Erreur d'initialisation de la caméra");
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(this.onBarcodeDetected.bind(this));
    }

    async onBarcodeDetected(result) {
        if (!this.scannerActive) return;
        
        this.scannerActive = false;
        Quagga.stop();

        const barcode = result.codeResult.code;
        this.resultDiv.classList.remove('hidden');
        this.loadingDiv.classList.remove('hidden');
        this.productInfo.style.display = 'none';

        try {
            const product = await this.fetchProduct(barcode);
            this.displayProduct(product);
        } catch (error) {
            alert("Erreur lors de la recherche du produit");
            this.scannerActive = true;
            this.startScanner();
        }
    }

    async fetchProduct(barcode) {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        const data = await response.json();
        
        if (data.status !== 1) {
            throw new Error('Produit non trouvé');
        }
        
        return data.product;
    }

    displayProduct(product) {
        this.loadingDiv.classList.add('hidden');
        this.productInfo.style.display = 'block';

        this.productName.textContent = product.product_name || 'Nom inconnu';
        this.productBrand.textContent = `Marque: ${product.brands || 'Inconnue'}`;

        // Afficher les valeurs nutritionnelles
        this.nutritionList.innerHTML = '';
        const nutriments = product.nutriments;
        const nutritionItems = [
            { label: 'Énergie', value: nutriments.energy_100g, unit: 'kcal' },
            { label: 'Protéines', value: nutriments.proteins_100g, unit: 'g' },
            { label: 'Glucides', value: nutriments.carbohydrates_100g, unit: 'g' },
            { label: 'Lipides', value: nutriments.fat_100g, unit: 'g' }
        ];

        nutritionItems.forEach(item => {
            if (item.value) {
                const li = document.createElement('li');
                li.textContent = `${item.label}: ${item.value}${item.unit}`;
                this.nutritionList.appendChild(li);
            }
        });

        this.ingredientsText.textContent = product.ingredients_text || 'Ingrédients non disponibles';
    }
}

// Initialiser le scanner quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    new BarcodeScanner();
}); 
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const homeView = document.getElementById('home-view');
    const editDeckView = document.getElementById('edit-deck-view');
    const studyView = document.getElementById('study-view');
    const decksContainer = document.getElementById('decks-container');
    const createDeckBtn = document.getElementById('create-deck-btn');
    const backToHomeBtn = document.getElementById('back-to-home');
    const backFromStudyBtn = document.getElementById('back-from-study');
    const saveDeckBtn = document.getElementById('save-deck-btn');
    const cancelDeckBtn = document.getElementById('cancel-deck-btn');
    const addFlashcardBtn = document.getElementById('add-flashcard-btn');
    const flashcardsList = document.getElementById('flashcards-list');
    const deckNameInput = document.getElementById('deck-name');
    const deckDescriptionInput = document.getElementById('deck-description');
    const searchDecksInput = document.getElementById('search-decks');
    const studyFlashcard = document.getElementById('study-flashcard');
    const cardQuestion = document.getElementById('card-question');
    const cardAnswer = document.getElementById('card-answer');
    const prevCardBtn = document.getElementById('prev-card-btn');
    const nextCardBtn = document.getElementById('next-card-btn');
    const currentCardSpan = document.getElementById('current-card');
    const totalCardsSpan = document.getElementById('total-cards');
    const studyDeckName = document.getElementById('study-deck-name');
    
    // Templates
    const flashcardTemplate = document.getElementById('flashcard-template');
    const deckTemplate = document.getElementById('deck-template');
    
    // App State
    let decks = JSON.parse(localStorage.getItem('flashcardDecks')) || [];
    let currentDeckId = null;
    let currentCardIndex = 0;
    
    // Initialize the app
    init();
    
    function init() {
        renderDecks();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Navigation
        createDeckBtn.addEventListener('click', showCreateDeckView);
        backToHomeBtn.addEventListener('click', showHomeView);
        backFromStudyBtn.addEventListener('click', showHomeView);
        cancelDeckBtn.addEventListener('click', showHomeView);
        
        // Deck actions
        saveDeckBtn.addEventListener('click', saveDeck);
        addFlashcardBtn.addEventListener('click', addFlashcard);
        
        // Study mode
        studyFlashcard.addEventListener('click', toggleFlashcard);
        prevCardBtn.addEventListener('click', showPreviousCard);
        nextCardBtn.addEventListener('click', showNextCard);
        
        // Search
        searchDecksInput.addEventListener('input', filterDecks);
    }
    
    // View Management
    function showHomeView() {
        homeView.style.display = 'block';
        editDeckView.style.display = 'none';
        studyView.style.display = 'none';
        renderDecks();
    }
    
    function showCreateDeckView() {
        homeView.style.display = 'none';
        editDeckView.style.display = 'block';
        studyView.style.display = 'none';
        
        // Reset form
        deckNameInput.value = '';
        deckDescriptionInput.value = '';
        flashcardsList.innerHTML = '';
        currentDeckId = null;
        document.getElementById('edit-deck-title').textContent = 'Create New Deck';
        
        // Add first flashcard
        addFlashcard();
    }
    
    function showEditDeckView(deckId) {
        homeView.style.display = 'none';
        editDeckView.style.display = 'block';
        studyView.style.display = 'none';
        
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return;
        
        currentDeckId = deckId;
        document.getElementById('edit-deck-title').textContent = 'Edit Deck';
        deckNameInput.value = deck.name;
        deckDescriptionInput.value = deck.description || '';
        flashcardsList.innerHTML = '';
        
        // Add flashcards
        deck.cards.forEach((card, index) => {
            addFlashcard(card.question, card.answer, index);
        });
    }
    
    function showStudyView(deckId) {
        homeView.style.display = 'none';
        editDeckView.style.display = 'none';
        studyView.style.display = 'block';
        
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return;
        
        currentDeckId = deckId;
        currentCardIndex = 0;
        studyDeckName.textContent = deck.name;
        totalCardsSpan.textContent = deck.cards.length;
        
        if (deck.cards.length > 0) {
            updateStudyCard();
        } else {
            cardQuestion.textContent = 'This deck has no cards';
            cardAnswer.textContent = 'Add cards to start studying';
        }
        
        // Reset card to front
        if (studyFlashcard.classList.contains('flipped')) {
            studyFlashcard.classList.remove('flipped');
        }
    }
    
    // Deck Management
    function renderDecks() {
        decksContainer.innerHTML = '';
        
        if (decks.length === 0) {
            decksContainer.innerHTML = '<p class="no-decks">No decks created yet. Click "Create New Deck" to get started!</p>';
            return;
        }
        
        decks.forEach(deck => {
            const deckElement = deckTemplate.content.cloneNode(true);
            deckElement.querySelector('.deck-name').textContent = deck.name;
            deckElement.querySelector('.deck-card-count').textContent = `${deck.cards.length} card${deck.cards.length !== 1 ? 's' : ''}`;
            
            if (deck.description) {
                deckElement.querySelector('.deck-description').textContent = deck.description;
            }
            
            // Add event listeners
            deckElement.querySelector('.study-deck-btn').addEventListener('click', () => showStudyView(deck.id));
            deckElement.querySelector('.edit-deck-btn').addEventListener('click', () => showEditDeckView(deck.id));
            deckElement.querySelector('.delete-deck-btn').addEventListener('click', () => deleteDeck(deck.id));
            
            decksContainer.appendChild(deckElement);
        });
    }
    
    function saveDeck() {
        const name = deckNameInput.value.trim();
        const description = deckDescriptionInput.value.trim();
        
        if (!name) {
            alert('Please enter a deck name');
            return;
        }
        
        // Get all flashcards
        const flashcardItems = flashcardsList.querySelectorAll('.flashcard-item');
        const cards = [];
        
        flashcardItems.forEach(item => {
            const question = item.querySelector('.flashcard-question').value.trim();
            const answer = item.querySelector('.flashcard-answer').value.trim();
            
            if (question && answer) {
                cards.push({ question, answer });
            }
        });
        
        if (cards.length === 0) {
            alert('Please add at least one flashcard');
            return;
        }
        
        if (currentDeckId) {
            // Update existing deck
            const deckIndex = decks.findIndex(d => d.id === currentDeckId);
            if (deckIndex !== -1) {
                decks[deckIndex] = {
                    ...decks[deckIndex],
                    name,
                    description,
                    cards
                };
            }
        } else {
            // Create new deck
            const newDeck = {
                id: Date.now().toString(),
                name,
                description,
                cards,
                createdAt: new Date().toISOString()
            };
            decks.push(newDeck);
        }
        
        // Save to localStorage
        localStorage.setItem('flashcardDecks', JSON.stringify(decks));
        
        // Return to home view
        showHomeView();
    }
    
    function deleteDeck(deckId) {
        if (confirm('Are you sure you want to delete this deck? This cannot be undone.')) {
            decks = decks.filter(d => d.id !== deckId);
            localStorage.setItem('flashcardDecks', JSON.stringify(decks));
            renderDecks();
        }
    }
    
    function filterDecks() {
        const searchTerm = searchDecksInput.value.trim().toLowerCase();
        const deckElements = decksContainer.querySelectorAll('.deck');
        
        deckElements.forEach(deckElement => {
            const deckName = deckElement.querySelector('.deck-name').textContent.toLowerCase();
            const deckDescription = deckElement.querySelector('.deck-description').textContent.toLowerCase();
            
            if (deckName.includes(searchTerm) || deckDescription.includes(searchTerm)) {
                deckElement.style.display = 'flex';
            } else {
                deckElement.style.display = 'none';
            }
        });
    }
    
    // Flashcard Management
    function addFlashcard(question = '', answer = '', index = null) {
        const flashcardElement = flashcardTemplate.content.cloneNode(true);
        const flashcardItem = flashcardElement.querySelector('.flashcard-item');
        
        if (index !== null) {
            flashcardItem.querySelector('.flashcard-number').textContent = `Card #${index + 1}`;
        } else {
            const cardCount = flashcardsList.querySelectorAll('.flashcard-item').length;
            flashcardItem.querySelector('.flashcard-number').textContent = `Card #${cardCount + 1}`;
        }
        
        if (question) {
            flashcardItem.querySelector('.flashcard-question').value = question;
        }
        
        if (answer) {
            flashcardItem.querySelector('.flashcard-answer').value = answer;
        }
        
        // Add delete event listener
        flashcardItem.querySelector('.delete-flashcard-btn').addEventListener('click', (e) => {
            if (flashcardsList.querySelectorAll('.flashcard-item').length > 1) {
                flashcardItem.remove();
                // Update card numbers
                const cards = flashcardsList.querySelectorAll('.flashcard-item');
                cards.forEach((card, idx) => {
                    card.querySelector('.flashcard-number').textContent = `Card #${idx + 1}`;
                });
            } else {
                alert('A deck must have at least one flashcard');
            }
        });
        
        flashcardsList.appendChild(flashcardElement);
    }
    
    // Study Mode Functions
    function toggleFlashcard() {
        studyFlashcard.classList.toggle('flipped');
    }
    
    function updateStudyCard() {
        const deck = decks.find(d => d.id === currentDeckId);
        if (!deck || deck.cards.length === 0) return;
        
        const card = deck.cards[currentCardIndex];
        cardQuestion.textContent = card.question;
        cardAnswer.textContent = card.answer;
        currentCardSpan.textContent = currentCardIndex + 1;
        
        // Reset to front if flipped
        if (studyFlashcard.classList.contains('flipped')) {
            studyFlashcard.classList.remove('flipped');
        }
    }
    
    function showNextCard() {
        const deck = decks.find(d => d.id === currentDeckId);
        if (!deck) return;
        
        if (currentCardIndex < deck.cards.length - 1) {
            currentCardIndex++;
            updateStudyCard();
        } else {
            // Loop to first card
            currentCardIndex = 0;
            updateStudyCard();
        }
    }
    
    function showPreviousCard() {
        const deck = decks.find(d => d.id === currentDeckId);
        if (!deck) return;
        
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateStudyCard();
        } else {
            // Loop to last card
            currentCardIndex = deck.cards.length - 1;
            updateStudyCard();
        }
    }
    
    // Keyboard navigation in study mode
    document.addEventListener('keydown', (e) => {
        if (studyView.style.display === 'block') {
            if (e.key === 'ArrowRight') {
                showNextCard();
            } else if (e.key === 'ArrowLeft') {
                showPreviousCard();
            } else if (e.key === ' ' || e.key === 'Spacebar') {
                toggleFlashcard();
                e.preventDefault();
            }
        }
    });
});

//dark mode

document.getElementById("toggle-theme-btn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

//import export

// ===== IMPORT JSON FUNCTION (UNCHANGED) =====
document.getElementById('import-pdf-btn').addEventListener('click', () => {
  document.getElementById('import-pdf-file').click();
});

document.getElementById('import-pdf-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedarray = new Uint8Array(this.result);

    const pdf = await pdfjsLib.getDocument(typedarray).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }

    // Convert extracted text into flashcards (simple format: Q: ... A: ...)
    const flashcards = [];
    const lines = fullText.split("\n");
    for (let line of lines) {
      if (line.includes("Q:") && line.includes("A:")) {
        const [qPart, aPart] = line.split("A:");
        flashcards.push({
          question: qPart.replace("Q:", "").trim(),
          answer: aPart.trim()
        });
      }
    }

    if (flashcards.length === 0) {
      alert("No valid flashcards found in PDF. Use format: Q: ... A: ...");
      return;
    }

    const newDeck = {
      name: "Imported from PDF",
      description: "Auto-created from PDF",
      cards: flashcards
    };

    const existingDecks = JSON.parse(localStorage.getItem("flashcardDecks")) || [];
    existingDecks.push(newDeck);
    localStorage.setItem("flashcardDecks", JSON.stringify(existingDecks));
    renderDecks();
    alert("PDF imported successfully as a deck!");
  };

  fileReader.readAsArrayBuffer(file);
});



// ===== EXPORT AS PDF FUNCTION =====
document.getElementById("export-btn").addEventListener("click", async () => {
  const decks = JSON.parse(localStorage.getItem("flashcardDecks")) || [];

  if (decks.length === 0) {
    alert("No decks to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let yOffset = 10;

  decks.forEach((deck, index) => {
    pdf.setFontSize(16);
    pdf.text(`Deck: ${deck.name}`, 10, yOffset);
    yOffset += 8;

    if (deck.description) {
      pdf.setFontSize(12);
      pdf.text(`Description: ${deck.description}`, 10, yOffset);
      yOffset += 8;
    }

    if (deck.cards && deck.cards.length > 0) {
      deck.cards.forEach((card, cardIndex) => {
        if (yOffset > 270) {
          pdf.addPage();
          yOffset = 10;
        }

        pdf.setFontSize(12);
        pdf.text(`Q${cardIndex + 1}: ${card.question}`, 10, yOffset);
        yOffset += 6;
        pdf.text(`A${cardIndex + 1}: ${card.answer}`, 10, yOffset);
        yOffset += 10;
      });
    } else {
      pdf.text("No cards in this deck.", 10, yOffset);
      yOffset += 10;
    }

    if (index < decks.length - 1) {
      pdf.addPage();
      yOffset = 10;
    }
  });

  pdf.save("flashcards.pdf");
});


//auto flip

let autoFlipInterval;

function startAutoFlip() {
  clearInterval(autoFlipInterval);
  const time = parseInt(document.getElementById('auto-flip-time').value);
  if (time > 0) {
    autoFlipInterval = setInterval(() => {
      document.getElementById('next-card-btn').click();
    }, time * 1000);
  }
}
document.getElementById('auto-flip-time').addEventListener('change', startAutoFlip);

//shuffle

document.getElementById('shuffle-btn').addEventListener('click', () => {
  currentDeck.cards.sort(() => Math.random() - 0.5);
  currentCardIndex = 0;
  renderCurrentCard();
});



//logic to store 

let knownCards = new Set();
let reviewCards = new Set();

document.getElementById('mark-known-btn').addEventListener('click', () => {
  knownCards.add(currentCardIndex);
});

document.getElementById('mark-review-btn').addEventListener('click', () => {
  reviewCards.add(currentCardIndex);
});

//dark mode
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});



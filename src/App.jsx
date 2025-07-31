import { useState, useRef, useEffect } from 'react';
import BookCard from './components/BookCard';
import Reader from './components/reader';

// Correctly import the pdfjs-dist library
import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker. This is the correct and most reliable way.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

function App() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('bookshelf');
  const [currentBook, setCurrentBook] = useState(null);
  const [modal, setModal] = useState({ type: null, data: null });
  const fileInputRef = useRef(null);

  // --- LOCAL STORAGE HOOKS ---
  useEffect(() => {
    try {
      const storedBooks = localStorage.getItem('bookorganizer_books');
      if (storedBooks) {
        setBooks(JSON.parse(storedBooks));
      }
    } catch (error) {
      console.error("Error parsing JSON from localStorage", error);
      localStorage.removeItem('bookorganizer_books');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bookorganizer_books', JSON.stringify(books));
  }, [books]);


  // --- FILE HANDLING ---
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const coverImage = canvas.toDataURL();
      const pdfDataAsBase64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const newBook = {
        id: Date.now().toString(),
        title: file.name.replace('.pdf', ''),
        totalPages: pdf.numPages,
        lastVisitedPage: 1,
        pdfData: pdfDataAsBase64,
        coverImage: coverImage,
      };
      setBooks(prevBooks => [...prevBooks, newBook]);
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Sorry, there was an error processing that PDF.");
    } finally {
      setIsLoading(false);
      event.target.value = null;
    }
  };

  // --- BOOK & VIEW ACTIONS ---
  const handleOpenBook = (book) => {
    setCurrentBook(book);
    setView('reader');
  };

  const handleUpdateProgress = (bookId, newPage) => {
    setBooks(books.map(b => 
      b.id === bookId ? { ...b, lastVisitedPage: newPage } : b
    ));
  };

  const confirmDelete = () => {
    if (modal.data) {
      setBooks(books.filter(b => b.id !== modal.data.id));
      setModal({ type: null, data: null });
    }
  };

  // --- NEW, ROBUST MODAL HANDLER ---
  // This single function handles all logic for closing the reader view from the modal.
  const handleCloseReaderModal = (shouldSave) => {
    if (shouldSave && modal.type === 'save' && modal.data) {
      // If saving, update the progress first.
      const { bookId, newPage } = modal.data;
      handleUpdateProgress(bookId, newPage);
    }
    
    // Perform all necessary state updates to cleanly exit the reader.
    setView('bookshelf');
    setCurrentBook(null);
    setModal({ type: null, data: null });
  };
  
  // --- RENDER LOGIC ---

  if (view === 'reader') {
    return (
      <Reader 
        book={currentBook} 
        onClose={(newPage, hasChanged) => {
          if (hasChanged) {
            setModal({ type: 'save', data: { bookId: currentBook.id, newPage: newPage } });
          } else {
            setView('bookshelf');
            setCurrentBook(null);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#ECF0F1]">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#CB4335]">BookOrganizer</h1>
      </header>

      <main className="p-4 sm:p-6 md:p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Library</h2>
        
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {books.map(book => (
              <BookCard 
                key={book.id} 
                book={book}
                onOpen={() => handleOpenBook(book)} 
                onDelete={() => setModal({ type: 'delete', data: book })}
              />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">Your library is empty.</p>
              <p>Click the '+' button to add your first book.</p>
            </div>
          )
        )}
      </main>

      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <button 
        onClick={() => fileInputRef.current.click()}
        className="fixed bottom-8 right-8 bg-[#CB4335] text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-4xl font-light transition-transform hover:scale-110 hover:bg-[#a12a1c]"
        disabled={isLoading}
      >
        {isLoading ? (
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : '+'}
      </button>

      {/* --- MODAL RENDERING --- */}
      {modal.type === 'delete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Are you sure?</h2>
            <p className="text-gray-600 mb-8">This will remove "{modal.data?.title}" from your library.</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setModal({ type: null, data: null })} className="bg-gray-200 text-gray-800 font-semibold py-2 px-8 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={confirmDelete} className="bg-[#CB4335] text-white font-semibold py-2 px-8 rounded-lg hover:bg-[#a12a1c]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'save' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Save Progress?</h2>
            <p className="text-gray-600 mb-8">Do you want to save your progress before exiting?</p>
            <div className="flex justify-center space-x-4">
              {/* Use the new handler function */}
              <button onClick={() => handleCloseReaderModal(false)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-8 rounded-lg hover:bg-gray-300">Exit without Saving</button>
              <button onClick={() => handleCloseReaderModal(true)} className="bg-[#CB4335] text-white font-semibold py-2 px-8 rounded-lg hover:bg-[#a12a1c]">Save & Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

function Reader({ book, onClose }) {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(book.lastVisitedPage);
  const canvasRef = useRef(null);
  // Keep track of the current render task to allow for cancellation
  const renderTaskRef = useRef(null);

  // This effect runs once to load the PDF document from the Base64 data.
  useEffect(() => {
    // Decode the Base64 string back into binary data
    const pdfData = atob(book.pdfData);
    const typedarray = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
      typedarray[i] = pdfData.charCodeAt(i);
    }

    // Use pdf.js to load the document.
    const loadingTask = pdfjsLib.getDocument(typedarray);
    loadingTask.promise.then(loadedPdf => {
      setPdf(loadedPdf);
    });
  }, [book.pdfData]); // This effect only re-runs if the book itself changes

  // This effect is responsible for rendering the PDF page onto the canvas.
  // It re-runs whenever the loaded PDF or the current page number changes.
  useEffect(() => {
    if (!pdf) return;

    let isCancelled = false;

    // Before starting a new render, cancel any render that is currently in progress.
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    // Get the desired page from the PDF document.
    pdf.getPage(currentPage).then(page => {
      if (isCancelled) return; // Don't render if the component has already unmounted

      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      // Start the render task and store a reference to it.
      const task = page.render(renderContext);
      renderTaskRef.current = task;

      task.promise.catch(error => {
        // It's normal for a render to be cancelled, so we don't log that as an error.
        if (error.name !== 'RenderingCancelledException') {
          console.error('Page render error:', error);
        }
      });
    });

    // This is the cleanup function. It runs when the effect is about to re-run or when the component is unmounted.
    // This is the key to preventing the race condition error.
    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, currentPage]);


  // --- NAVIGATION CONTROLS ---
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(book.totalPages, prev + 1));
  };

  // --- COMPONENT RENDER ---
  return (
    <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col">
      {/* Reader Header with navigation controls */}
      <header className="bg-gray-900 text-white p-3 flex justify-between items-center flex-shrink-0 shadow-lg">
        <button 
          onClick={() => onClose(currentPage, currentPage !== book.lastVisitedPage)} 
          className="text-white hover:text-[#CB4335] font-medium flex items-center space-x-2 px-3 py-1 rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Back to Library</span>
        </button>
        
        <div className="text-center">
          <h3 className="font-bold truncate max-w-xs sm:max-w-md md:max-w-lg">{book.title}</h3>
          <p className="text-sm text-gray-400">Page {currentPage} of {book.totalPages}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button onClick={goToPrevPage} disabled={currentPage === 1} className="px-3 py-1 rounded-md disabled:opacity-50">Prev</button>
          <button onClick={goToNextPage} disabled={currentPage === book.totalPages} className="px-3 py-1 rounded-md disabled:opacity-50">Next</button>
        </div>
      </header>
      
      {/* The main area where the PDF page is rendered onto the canvas */}
      <div className="flex-grow overflow-auto flex justify-center p-4">
        <canvas ref={canvasRef} className="shadow-2xl"></canvas>
      </div>
    </div>
  );
}

export default Reader;

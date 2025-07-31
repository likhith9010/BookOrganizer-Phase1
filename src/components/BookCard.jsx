// This component displays a single book.
// It receives the book's details and two functions (onOpen, onDelete) as 'props'.
function BookCard({ book, onOpen, onDelete }) {

  // This function stops the card's main onOpen event from firing when the delete button is clicked.
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevents the click from bubbling up to the parent div
    onDelete();
  };

  return (
    // The main div now has an onOpen handler for clicking anywhere on the card.
    <div 
      onClick={onOpen}
      className="bg-white rounded-lg shadow-md p-3 flex flex-col items-center text-center transition-transform hover:-translate-y-1 relative group cursor-pointer"
    >
      {/* The delete button, which appears only when hovering over the card ('group-hover') */}
      <button 
        onClick={handleDeleteClick}
        className="delete-button absolute top-2 right-2 bg-black bg-opacity-50 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10" 
        aria-label="Delete book"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>

      {/* The book cover image we will generate */}
      <img 
        src={book.coverImage} 
        alt={book.title} 
        className="w-full h-auto rounded-md mb-3 shadow-lg" 
      />
      
      {/* The book title */}
      <h3 className="font-semibold text-sm mb-2 truncate w-full">{book.title}</h3>
      
      {/* The progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-[#CB4335] h-2 rounded-full" 
          style={{ width: `${(book.lastVisitedPage / book.totalPages) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

export default BookCard;

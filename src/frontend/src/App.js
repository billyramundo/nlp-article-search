import './App.css';
import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [numResults, setNumResults] = useState(5);
  const [currentPage, setCurrentPage] = useState(0);
  const [exactSearch, setExactSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setQuery('');
    setIsLoading(true)
    setResults([])
    // fetch from the backend
    const res = await fetch('/get_trials', {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify({data: query, num: numResults, exact: exactSearch})
    })

    if(!res.ok){
      const errorData = await res.json();
      alert(errorData.error)
      throw new Error(errorData.error || "An unknown error occurred");
    }
    const data = await res.json();
    setIsLoading(false);
    setResults(JSON.parse(data));
    console.log(results);
  };

  //animation for the button
  const handleButtonClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 200);
  };


  const totalPages = results.length / 5;
  const currentResults = results.slice(currentPage * 5, (currentPage + 1) * 5);

  // Handlers for pagination
  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <h2 className="text-xl top-0 left-0 font-bold text-purple-500 italic">
        Argon AI
      </h2>
      <h1 className="text-3xl font-bold top-5 text-center text-purple-500 mb-4">
        Find Clinical Trials
      </h1>
      <div className="flex flex-col items-center">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex space-x-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Enter your topic"
            />
            <select
              value={numResults}
              onChange={(e) => setNumResults(parseInt(e.target.value))}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {[5, 10, 15, 20, 25].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!query}
              className={`bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:pointer-events-none disabled:opacity-50 ${isAnimating ? 'animate-click' : ''}`}
              onClick={handleButtonClick}
            >
              Submit
            </button>
          </form>
          {/* Including this for now to explain to users how they can get additional functionality out of the search experience */}
          <h3 className='text-sm text-gray-500 mb-2'>If you want trials with an exact match to your search query, check the box below (WATCH OUT FOR TYPOS). If you have multiple search terms, please separate them with "AND" (e.g. lung cancer AND immunotherapy)</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exactSearch}
              onChange={(e) => setExactSearch(e.target.checked)}
              id="exactSearch"
              className="h-4 w-4 text-purple-500 border-gray-300 rounded focus:ring-purple-400 mb-2"
            />
            <label htmlFor="exactSearch" className="text-gray-700 mb-2">
              Exact Match?
            </label>
          </div>

          <div>
            {currentResults.length === 0 && !isLoading ? (
              <div className="p-2 bg-gray-50 mb-2 rounded shadow-sm text-gray-500">
              No results found.
              </div>
            ) : (
              currentResults.map((result, index) => (
                <div key={index} className="p-2 bg-gray-50 mb-2 rounded shadow-sm">
                  <a href={result['Study URL']} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {result['Study Title']}
                  </a>
                </div>
              ))
            )}
          </div>
          {results.length > 5 && (
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

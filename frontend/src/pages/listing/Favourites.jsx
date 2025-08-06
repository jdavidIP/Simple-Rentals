import { useProfileContext } from "../../contexts/ProfileContext";
import ListingCard from "../../components/cards/ListingCard";
import SortDropdown from "../../components/SortDropdown";
import Pagination from "../../components/Pagination";
import { useState, useEffect } from "react";

function Favourites() {
  const { favourites, profile, favouritesLoading, favouritesError } =
    useProfileContext();
  const [processed, setProcessed] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("newest");
  const totalPages = Math.ceil(favourites.length / itemsPerPage);

  useEffect(() => {
    let processedFavourites = favourites.map((favourite) => {
      const primaryImage = favourite.pictures?.find((p) => p.is_primary);
      return { ...favourite, primary_image: primaryImage };
    });
    setProcessed(processedFavourites);
  }, [favourites]);

  const sortedListings = [...processed].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      case "priceLowHigh":
        return a.price - b.price;
      case "priceHighLow":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const paginatedListings = sortedListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container py-5">
      <h2 className="mb-5 text-center fw-bold display-6">♥ Your Favourites</h2>
      {favouritesError ? (
        <div className="alert alert-danger">{error}</div>
      ) : favouritesLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          <SortDropdown sortOption={sortOption} setSortOption={setSortOption} />

          {paginatedListings.length === 0 ? (
            <p className="text-muted text-center">No listings found.</p>
          ) : (
            <div className="row listings-grid">
              {paginatedListings.map((favourite) => (
                <div className="col-md-4" key={favourite.id}>
                  <ListingCard
                    listing={favourite}
                    styling={true}
                    showFavourite={true}
                    income={profile.yearly_income}
                  />
                </div>
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={processed.length}
            pageSize={itemsPerPage}
            onPageSizeChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}

export default Favourites;

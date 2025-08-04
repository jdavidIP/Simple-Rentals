import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import "../../styles/forms.css";
import useGoogleMaps from "../../hooks/useGoogleMaps";

function FormListing({ method, listing }) {
  const [formData, setFormData] = useState({
    price: listing?.price || "",
    property_type: listing?.property_type[0] || "",
    payment_type:
      listing?.payment_type === "Chexy" ? "X" : listing?.payment_type[0] || "",
    bedrooms: listing?.bedrooms || "",
    bathrooms: listing?.bathrooms || "",
    sqft_area: listing?.sqft_area || "",
    laundry_type: listing?.laundry_type[0] || "",
    parking_spaces: listing?.parking_spaces || "",
    heating: listing?.heating || false,
    ac: listing?.ac || false,
    extra_amenities: listing?.extra_amenities || "",
    pet_friendly: listing?.pet_friendly || false,
    move_in_date: listing?.move_in_date || "",
    description: listing?.description || "",
    unit_number: listing?.unit_number || "",
    street_address: listing?.street_address || "",
    city: listing?.city || "",
    postal_code: listing?.postal_code || "",
    heat: listing?.heat || false,
    hydro: listing?.hydro || false,
    water: listing?.water || false,
    fridge: listing?.fridge || false,
    internet: listing?.internet || false,
    furnished: listing?.furnished || false,
    pictures: [],
    front_image: null,
    delete_images: [],
    shareable: listing?.shareable || false,
  });

  const [existingImages, setExistingImages] = useState(listing?.pictures || []);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [latLng, setLatLng] = useState({
    lat: listing?.latitude || null,
    lng: listing?.longitude || null,
  });
  const navigate = useNavigate();
  const errorRef = useRef(null);
  const addressInputRef = useRef(null);

  const { googleMaps } = useGoogleMaps();

  useEffect(() => {
    if (!googleMaps) return;

    if (!addressInputRef.current) return;

    const autocomplete = new googleMaps.maps.places.Autocomplete(
      addressInputRef.current,
      { types: ["geocode"] }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (place.geometry) {
        const streetNumber =
          place.address_components?.find((c) =>
            c.types.includes("street_number")
          )?.long_name || "";
        const route =
          place.address_components?.find((c) => c.types.includes("route"))
            ?.long_name || "";

        const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

        setFormData((prev) => ({
          ...prev,
          street_address: streetAddress || prev.street_address,
          city:
            place.address_components?.find((c) => c.types.includes("locality"))
              ?.long_name || prev.city,
          postal_code:
            place.address_components?.find((c) =>
              c.types.includes("postal_code")
            )?.long_name || prev.postal_code,
        }));

        setLatLng({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });

    return () => {
      googleMaps.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [googleMaps]);

  // Validation logic
  function validateFields(data) {
    const errors = {};
    if (!data.street_address || data.street_address.length < 3)
      errors.street_address = "Street address is required.";
    if (!data.city || data.city.length < 2) errors.city = "City is required.";
    if (!data.postal_code || data.postal_code.length < 5)
      errors.postal_code = "Postal code is required.";
    if (!data.price || Number(data.price) <= 0)
      errors.price = "Price must be greater than 0.";
    if (!data.property_type)
      errors.property_type = "Property type is required.";
    if (!data.sqft_area || Number(data.sqft_area) <= 0)
      errors.sqft_area = "Area must be greater than 0.";
    if (!data.payment_type) errors.payment_type = "Payment type is required.";
    if (!data.laundry_type) errors.laundry_type = "Laundry type is required.";
    if (!data.bedrooms || Number(data.bedrooms) < 0)
      errors.bedrooms = "Bedrooms required.";
    if (!data.bathrooms || Number(data.bathrooms) < 0)
      errors.bathrooms = "Bathrooms required.";
    if (!data.parking_spaces || Number(data.parking_spaces) < 0)
      errors.parking_spaces = "Parking spaces required.";
    if (!data.move_in_date) errors.move_in_date = "Move-in date is required.";
    if (!data.description || data.description.length < 10)
      errors.description = "Description must be at least 10 characters.";
    return errors;
  }

  // Handle changes (no validation here)
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let fieldValue =
      type === "checkbox" ? checked : type === "file" ? files : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  // Handle blur (validate field)
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
  };

  // Show error message
  const errMsg = (name) =>
    touched[name] && fieldErrors[name] ? (
      <div className="field-error">{fieldErrors[name]}</div>
    ) : null;

  // Handle image inputs
  const handleFileInputChange = (e) => {
    const { name, files } = e.target;
    const newFiles = Array.from(files);
    const currentCount = existingImages.length - formData.delete_images.length;
    const totalCount = currentCount + newFiles.length;

    if (totalCount > 10) {
      alert("You can upload a maximum of 10 images.");
      return;
    }

    if (name === "front_image") {
      setFormData({ ...formData, front_image: newFiles[0] });
    } else if (name === "pictures") {
      setFormData((prevData) => ({
        ...prevData,
        pictures: [...prevData.pictures, ...newFiles],
      }));
    }
  };

  const handleDeleteImage = (imageId) => {
    setFormData((prevData) => ({
      ...prevData,
      delete_images: [...prevData.delete_images, imageId],
    }));
    setExistingImages((prevImages) =>
      prevImages.filter((image) => image.id !== imageId)
    );
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (
      !window.confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.delete(`/listings/delete/${listing.id}`);
      navigate("/listings");
    } catch (err) {
      setError("Failed to delete listing.");
    }
  };

  const validateImages = () => {
    const totalImages =
      formData.pictures.length +
      existingImages.length -
      formData.delete_images.length;

    if (
      !formData.front_image &&
      !existingImages.some((img) => img.is_primary)
    ) {
      setError("A front image is required.");
      return false;
    }

    if (totalImages < 3) {
      setError("You must have at least 3 images in total.");
      return false;
    }

    if (totalImages > 10) {
      setError("You can upload a maximum of 10 images.");
      return false;
    }

    setError(null);
    return true;
  };

  // Submit with full validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateFields(formData);
    setFieldErrors(validationErrors);
    setTouched(Object.fromEntries(Object.keys(formData).map((k) => [k, true])));
    if (Object.keys(validationErrors).length > 0) {
      if (errorRef.current)
        errorRef.current.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (!validateImages()) return;

    try {
      const data = new FormData();

      if (formData.front_image)
        data.append("front_image", formData.front_image);
      formData.pictures.forEach((file) => data.append("pictures", file));
      formData.delete_images.forEach((id) => data.append("delete_images", id));

      Object.entries(formData).forEach(([key, value]) => {
        if (
          key !== "pictures" &&
          key !== "front_image" &&
          key !== "delete_images"
        ) {
          data.append(key, value);
        }
      });

      if (latLng.lat && latLng.lng) {
        data.append("latitude", latLng.lat);
        data.append("longitude", latLng.lng);
      }

      if (method === "post") {
        await api.post("/listings/add", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        navigate("/listings");
      } else if (method === "edit") {
        await api.patch(`/listings/edit/${listing.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        navigate(`/listings/${listing.id}`);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  // Previews
  const renderExistingImagePreview = (images) =>
    images
      .filter((img) => !formData.delete_images.includes(img.id))
      .map((img) => (
        <div key={img.id} className="image-tile">
          {img.is_primary && <span className="image-badge">Primary</span>}
          <img src={img.image} alt="Preview" />
          <button
            type="button"
            aria-label="Remove image"
            className="image-remove"
            onClick={() => handleDeleteImage(img.id)}
            title="Remove"
          >
            <span className="image-remove-x">&times;</span>
          </button>
        </div>
      ));

  const renderNewImagePreview = () =>
    formData.pictures.map((file, index) => (
      <div key={index} className="image-tile">
        <img src={URL.createObjectURL(file)} alt="Preview" />
        <button
          type="button"
          aria-label="Remove image"
          className="image-remove"
          onClick={() =>
            setFormData((prevData) => ({
              ...prevData,
              pictures: prevData.pictures.filter((_, i) => i !== index),
            }))
          }
          title="Remove"
        >
          <span className="image-remove-x">&times;</span>
        </button>
      </div>
    ));

  const renderNewFrontImagePreview = () => {
    if (!formData.front_image) return null;

    return (
      <div className="image-tile">
        <img src={URL.createObjectURL(formData.front_image)} alt="Preview" />
        <button
          type="button"
          aria-label="Remove image"
          className="image-remove"
          onClick={() =>
            setFormData((prevData) => ({
              ...prevData,
              front_image: null,
            }))
          }
          title="Remove"
        >
          <span className="image-remove-x">&times;</span>
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error]);

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{method === "post" ? "Create Listing" : "Edit Listing"}</h1>
      {error && (
        <div ref={errorRef} className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Location Section */}
      <h5 className="form-section-title">Location</h5>
      <div className="mb-3">
        <label htmlFor="street_address">Street Address</label>
        <input
          type="text"
          id="street_address"
          name="street_address"
          ref={addressInputRef}
          value={formData.street_address}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errMsg("street_address")}
      </div>
      <div className="form-grid">
        <div>
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.street_address ? formData.city : ""}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={true}
            required
          />
          {errMsg("city")}
        </div>
        <div>
          <label htmlFor="postal_code">Postal Code</label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={formData.street_address ? formData.postal_code : ""}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={true}
            required
          />
          {errMsg("postal_code")}
        </div>
      </div>

      {/* Property Details */}
      <h5 className="form-section-title">Property Details</h5>
      <div className="form-grid">
        <div>
          <label htmlFor="price">Price</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errMsg("price")}
        </div>
        <div>
          <label htmlFor="property_type">Property Type</label>
          <select
            id="property_type"
            name="property_type"
            value={formData.property_type}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select</option>
            <option value="H">House</option>
            <option value="A">Apartment</option>
            <option value="C">Condo</option>
            <option value="T">Townhouse</option>
            <option value="O">Other</option>
          </select>
          {errMsg("property_type")}
        </div>
        <div>
          <label htmlFor="sqft_area">Square Footage</label>
          <input
            type="number"
            id="sqft_area"
            name="sqft_area"
            value={formData.sqft_area}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            required
          />
          {errMsg("sqft_area")}
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="bedrooms">Bedrooms</label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            required
          />
          {errMsg("bedrooms")}
        </div>
        <div>
          <label htmlFor="bathrooms">Bathrooms</label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            required
          />
          {errMsg("bathrooms")}
        </div>
        <div>
          <label htmlFor="parking_spaces">Parking Spaces</label>
          <input
            type="number"
            id="parking_spaces"
            name="parking_spaces"
            value={formData.parking_spaces}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            required
          />
          {errMsg("parking_spaces")}
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="payment_type">Payment Type</label>
          <select
            id="payment_type"
            name="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select</option>
            <option value="C">Cheque</option>
            <option value="D">Direct Deposit</option>
            <option value="I">Interac / Wire Transfer</option>
            <option value="P">PayPal</option>
            <option value="X">Chexy</option>
            <option value="O">Other</option>
          </select>
          {errMsg("payment_type")}
        </div>
        <div>
          <label htmlFor="laundry_type">Laundry Type</label>
          <select
            id="laundry_type"
            name="laundry_type"
            value={formData.laundry_type}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select</option>
            <option value="I">In-Unit</option>
            <option value="S">Shared</option>
            <option value="N">None</option>
          </select>
          {errMsg("laundry_type")}
        </div>
        <div>
          <label htmlFor="move_in_date">Move-in Date</label>
          <input
            type="date"
            id="move_in_date"
            name="move_in_date"
            value={formData.move_in_date}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errMsg("move_in_date")}
        </div>
        <label>
          <input
            type="checkbox"
            name="furnished"
            checked={formData.furnished}
            onChange={handleChange}
          />
          Furnished
        </label>
        <label>
          <input
            type="checkbox"
            name="pet_friendly"
            checked={formData.pet_friendly}
            onChange={handleChange}
          />
          Pet Friendly
        </label>
        <label>
          <input
            type="checkbox"
            name="shareable"
            checked={formData.shareable}
            onChange={handleChange}
          />
          Roommates Allowed
        </label>
      </div>

      {/* Amenities */}
      <h5 className="form-section-title">Amenities</h5>
      <div className="checkbox-grid">
        <label>
          <input
            type="checkbox"
            name="ac"
            checked={formData.ac}
            onChange={handleChange}
          />
          Air Conditioning
        </label>
        <label>
          <input
            type="checkbox"
            name="fridge"
            checked={formData.fridge}
            onChange={handleChange}
          />
          Fridge
        </label>
        <label>
          <input
            type="checkbox"
            name="heating"
            checked={formData.heating}
            onChange={handleChange}
          />
          Heating
        </label>
        <label>
          <input
            type="checkbox"
            name="internet"
            checked={formData.internet}
            onChange={handleChange}
          />
          Internet
        </label>
      </div>

      {/* Extra Amenities */}
      <div className="mb-3 py-2">
        <label htmlFor="extra_amenities">Extra Amenities</label>
        <textarea
          id="extra_amenities"
          name="extra_amenities"
          value={formData.extra_amenities}
          onChange={handleChange}
          onBlur={handleBlur}
        ></textarea>
      </div>

      {/* Description */}
      <h5 className="form-section-title">Description</h5>
      <textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      ></textarea>
      {errMsg("description")}

      {/* Costs & Fees */}
      <h5 className="form-section-title">Utilities</h5>
      <div className="checkbox-grid">
        <label>
          <input
            type="checkbox"
            name="heat"
            checked={formData.heat}
            onChange={handleChange}
          />
          Heat
        </label>
        <label>
          <input
            type="checkbox"
            name="hydro"
            checked={formData.hydro}
            onChange={handleChange}
          />
          Hydro
        </label>
        <label>
          <input
            type="checkbox"
            name="water"
            checked={formData.water}
            onChange={handleChange}
          />
          Water
        </label>
      </div>

      {/* Images */}
      <h5 className="form-section-title">Images</h5>
      <div className="mb-3">
        <label htmlFor="front_image">Front Image</label>
        <input
          type="file"
          id="front_image"
          name="front_image"
          onChange={handleFileInputChange}
        />
        <div className="image-preview-grid">
          {renderExistingImagePreview(
            existingImages.filter((img) => img.is_primary)
          )}
          {renderNewFrontImagePreview()}
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="pictures">Additional Images</label>
        <input
          type="file"
          id="pictures"
          name="pictures"
          onChange={handleFileInputChange}
          multiple
        />
        <div className="image-preview-grid">
          {renderExistingImagePreview(
            existingImages.filter((img) => !img.is_primary)
          )}
          {renderNewImagePreview()}
        </div>
      </div>

      {/* Buttons */}
      <button type="submit" className="btn btn-primary">
        {method === "post" ? "Create Listing" : "Save Changes"}
      </button>
      {method === "edit" && (
        <button type="delete" className="btn btn-danger" onClick={handleDelete}>
          Delete Listing
        </button>
      )}
    </form>
  );
}

export default FormListing;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/forms.css";

function FormListing({ method, listing }) {
  const [formData, setFormData] = useState({
    price: listing?.price || "",
    property_type: listing?.property_type[0] || "",
    payment_type:
      listing?.payment_type == "Chexy" ? "X" : listing?.payment_type[0] || "",
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
    utilities_cost: listing?.utilities_cost || "",
    utilities_payable_by_tenant: listing?.utilities_payable_by_tenant || false,
    property_taxes: listing?.property_taxes || "",
    property_taxes_payable_by_tenant:
      listing?.property_taxes_payable_by_tenant || false,
    condo_fee: listing?.condo_fee || "",
    condo_fee_payable_by_tenant: listing?.condo_fee_payable_by_tenant || false,
    hoa_fee: listing?.hoa_fee || "",
    hoa_fee_payable_by_tenant: listing?.hoa_fee_payable_by_tenant || false,
    security_deposit: listing?.security_deposit || "",
    security_deposit_payable_by_tenant:
      listing?.security_deposit_payable_by_tenant || false,
    pictures: [],
    front_image: null,
    delete_images: [],
  });
  const [existingImages, setExistingImages] = useState(listing?.pictures || []);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "file" ? files : value,
    });
  };

  const handleFileInputChange = (e) => {
    const { name, files } = e.target;
    if (name === "front_image") {
      setFormData({ ...formData, front_image: files[0] });
    } else if (name === "pictures") {
      setFormData({ ...formData, pictures: Array.from(files) });
      renderImagePreview(Array.from(files));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateImages()) {
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "pictures" && value.length > 0) {
          value.forEach((file) => data.append("pictures", file));
        } else if (key === "front_image" && value) {
          data.append("front_image", value);
        } else if (key === "delete_images" && value.length > 0) {
          value.forEach((imageId) => data.append("delete_images", imageId));
        } else {
          data.append(key, value);
        }
      });

      if (method === "post") {
        await api.post("/listings/add", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        navigate("/listings");
      } else if (method === "edit") {
        await api.patch(`/listings/edit/${listing.id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        navigate(`/listings/${listing.id}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        Array.isArray(err.response?.data)
          ? err.response.data
          : [err.response?.data || "An error occurred. Please try again."]
      );
    }
  };

  const renderImagePreview = (images) => {
    return images.map((img, index) => (
      <div key={index} className="image-container">
        <img
          src={img.image || URL.createObjectURL(img)}
          alt="Preview"
          style={{ maxWidth: "150px" }}
        />
        {img.id && (
          <button
            type="button"
            onClick={() => handleDeleteImage(img.id)}
            className="btn btn-danger"
          >
            Delete
          </button>
        )}
      </div>
    ));
  };

  console.log(listing);

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{method === "post" ? "Create Listing" : "Edit Listing"}</h1>
      {error && (
        <ul style={{ color: "red" }}>
          {Array.isArray(error) ? (
            error.map((errMsg, index) => <li key={index}>{errMsg}</li>)
          ) : (
            <li>{error}</li>
          )}
        </ul>
      )}
      <div className="mb-3">
        <label htmlFor="price">Price</label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="property_type">Property Type</label>
        <select
          id="property_type"
          name="property_type"
          value={formData.property_type[0]}
          onChange={handleChange}
          required
        >
          <option value="">Select</option>
          <option value="H">House</option>
          <option value="A">Apartment</option>
          <option value="C">Condo</option>
          <option value="T">Townhouse</option>
          <option value="O">Other</option>
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="sqft_area">Square Footage</label>
        <input
          type="number"
          id="sqft_area"
          name="sqft_area"
          value={formData.sqft_area}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="payment_type">Payment Type</label>
        <select
          id="payment_type"
          name="payment_type"
          value={
            formData.payment_type === "Chexy" ? "X" : formData.payment_type[0]
          }
          onChange={handleChange}
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
      </div>
      <div className="mb-3">
        <label htmlFor="laundry_type">Laundry Type</label>
        <select
          id="laundry_type"
          name="laundry_type"
          value={formData.laundry_type}
          onChange={handleChange}
          required
        >
          <option value="">Select</option>
          <option value="I">In-Unit</option>
          <option value="S">Shared</option>
          <option value="N">None</option>
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="bedrooms">Bedrooms</label>
        <input
          type="number"
          id="bedrooms"
          name="bedrooms"
          value={formData.bedrooms}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="bathrooms">Bathrooms</label>
        <input
          type="number"
          id="bathrooms"
          name="bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="parking_spaces">Parking Spaces</label>
        <input
          type="number"
          id="parking_spaces"
          name="parking_spaces"
          value={formData.parking_spaces}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="move_in_date">Move-in Date</label>
        <input
          type="date"
          id="move_in_date"
          name="move_in_date"
          value={formData.move_in_date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        ></textarea>
      </div>
      <div className="mb-3">
        <label htmlFor="street_address">Street Address</label>
        <input
          type="text"
          id="street_address"
          name="street_address"
          value={formData.street_address}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="city">City</label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="postal_code">Postal Code</label>
        <input
          type="text"
          id="postal_code"
          name="postal_code"
          value={formData.postal_code}
          onChange={handleChange}
          required
        />
      </div>

      {/* Front Image */}
      <div className="mb-3">
        <label htmlFor="front_image">Front Image</label>
        <input
          type="file"
          id="front_image"
          name="front_image"
          onChange={handleFileInputChange}
        />
        {renderImagePreview(existingImages.filter((img) => img.is_primary))}
      </div>

      {/* Additional Images */}
      <div className="mb-3">
        <label htmlFor="pictures">Additional Images</label>
        <input
          type="file"
          id="pictures"
          name="pictures"
          onChange={handleFileInputChange}
          multiple
        />
        {renderImagePreview(existingImages.filter((img) => !img.is_primary))}
        {renderImagePreview(formData.pictures)}
      </div>

      <button type="submit" className="btn btn-primary">
        {method === "post" ? "Create Listing" : "Save Changes"}
      </button>
    </form>
  );
}

export default FormListing;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/forms.css";

function FormListing({ method, listing }) {
  const [formData, setFormData] = useState({
    price: listing?.price || "",
    property_type: listing?.property_type || "",
    payment_type: listing?.payment_type || "",
    bedrooms: listing?.bedrooms || "",
    bathrooms: listing?.bathrooms || "",
    sqft_area: listing?.sqft_area || "",
    laundry_type: listing?.laundry_type || "",
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
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "file" ? files : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "pictures" && value.length > 0) {
          Array.from(value).forEach((file) => data.append("pictures", file));
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
      setError(err.response?.data || "An error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{method === "post" ? "Create Listing" : "Edit Listing"}</h1>
      {error && (
        <ul style={{ color: "red" }}>
          {Object.entries(error).map(([field, messages], index) => (
            <li key={index}>
              <strong>{field}:</strong> {messages.join(", ")}
            </li>
          ))}
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
        <label htmlFor="pictures">Pictures</label>
        <input
          type="file"
          id="pictures"
          name="pictures"
          onChange={handleChange}
          multiple
        />
      </div>
      <button type="submit" className="btn btn-primary">
        {method === "post" ? "Create Listing" : "Save Changes"}
      </button>
    </form>
  );
}

export default FormListing;

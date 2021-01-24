import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from '@apollo/react-hooks';
import { QUERY_LISTINGS } from "../utils/queries";
import spinner from '../assets/spinner.gif'
import { useStoreContext } from '../utils/GlobalState';
import { UPDATE_LISTINGS, REMOVE_FROM_CART, UPDATE_CART_QUANTITY, ADD_TO_CART } from '../utils/actions';
import Cart from '../components/Cart';
import { idbPromise } from '../utils/helpers';

function SingleItem() {
  const [state, dispatch] = useStoreContext();
  const { id } = useParams();

  const [currentListing, setCurrentListing] = useState({})

  const { loading, data } = useQuery(QUERY_LISTINGS);

  const { listings, cart } = state;

  const addToCart = () => {
    const itemInCart = cart.find((cartItem) => cartItem._id === id);

    if (itemInCart) {
      dispatch({
        type: UPDATE_CART_QUANTITY,
        _id: id,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1
      });

      idbPromise('cart', 'put', {
        ...itemInCart,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1
      });
    } else {
      dispatch({
        type: ADD_TO_CART,
        listing: { ...currentListing, purchaseQuantity: 1 }
      });

      idbPromise('cart', 'put', { ...currentListing, purchaseQuantity: 1 });
    }
  };

  const removeFromCart = () => {
    dispatch({
      type: REMOVE_FROM_CART,
      _id: currentListing._id
    });

    idbPromise('cart', 'delete', { ...currentListing });
  };

  useEffect(() => {
    // already in global store
    if (listings.length) {
      setCurrentListing(listings.find(listing => listing._id === id));
    }
    // retrieved from server
    else if (data) {
      dispatch({
        type: UPDATE_LISTINGS,
        listings: data.listings
      });

      data.listings.forEach((listing) => {
        idbPromise('listings', 'put', listing);
      });
    }
    // get cache from idb
    else if (!loading) {
      idbPromise('listings', 'get').then((indexedListings) => {
        dispatch({
          type: UPDATE_LISTINGS,
          listings: indexedListings
        });
      });
    }
  }, [listings, data, loading, dispatch, id]);

  return (
    <>
      {currentListing ? (
        <div className="container my-1">
          <Link to="/">
            ← Back to Listings
          </Link>

          <h2>{currentListing.name}</h2>

          <p>
            {currentListing.description}
          </p>

          <p>
            <strong>Price:</strong>
            ${currentListing.price}
            {" "}
            <button onClick={addToCart}>
              Add to Cart
            </button>
            <button
              disabled={!cart.find(p => p._id === currentListing._id)}
              onClick={removeFromCart}
            >
              Remove from Cart
            </button>
          </p>

          <img
            src={`/images/${currentListing.image}`}
            alt={currentListing.name}
          />
        </div>
      ) : null}
      {
        loading ? <img src={spinner} alt="loading" /> : null
      }
      <Cart />
    </>
  );
};

export default SingleItem;
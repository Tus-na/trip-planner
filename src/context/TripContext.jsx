import React, { createContext, useContext, useState } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [tripEvents, setTripEvents] = useState([]);
  const [tripMembers, setTripMembers] = useState([]); // Assuming you'll fetch members later

  // You can add more trip-related state and functions here

  return (
    <TripContext.Provider value={{ tripEvents, setTripEvents, tripMembers, setTripMembers }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  return useContext(TripContext);
};
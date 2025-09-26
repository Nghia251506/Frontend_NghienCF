import { configureStore } from "@reduxjs/toolkit";
import showReducer from "./ShowSlice";
// import departmentReducer from "./deparmentSlice";
// import gradeReducer from "./gradeSlice"
// import serviceReducer from "./serviceSlice"
// import aboutusReducer from "./aboutUsSlice"
// import servicePackageSlice from "./servicePackageSlice"
// import serviceRequestReducer from "./serviceRequestSlice"

export const store = configureStore({
  reducer: {
    shows: showReducer,
    // departments: departmentReducer,
    // grades: gradeReducer,
    // services: serviceReducer,
    // aboutuses: aboutusReducer,
    // servicePackage: servicePackageSlice,
    // servicerequests: serviceRequestReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
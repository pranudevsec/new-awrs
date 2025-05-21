import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
// Reducers
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/auth/authSlice';

const getConfig = (key: string, whitelist: string[]) => {
    return {
        key,
        storage,
        whitelist,
    };
};

const reducer = combineReducers({
    admin: persistReducer(getConfig('admin', ['admin']), authReducer),
});

export const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
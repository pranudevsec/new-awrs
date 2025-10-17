import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/auth/authSlice';
import configReducer from './slices/config/configSlice';
import parameterReducer from './slices/parameter/parameterSlice';
import citationReducer from './slices/citation/citationSlice';
import appreciationReducer from './slices/appreciation/appreciationSlice';
import applicationReducer from './slices/application/applicationSlice';
import clarificationReducer from './slices/clarification/clarificationSlice';
import commandPanelReducer from './slices/command-panel/commandPanelSlice';
import brigadeReducer from './slices/command-panel/BrigadeSlice';
import masterReducer from './slices/master/masterSlice';

const getConfig = (key: string, whitelist: string[]) => {
    return {
        key,
        storage,
        whitelist,
    };
};

const reducer = combineReducers({
    admin: persistReducer(getConfig('admin', ['admin', 'profile']), authReducer),
    config: configReducer,
    parameter: parameterReducer,
    citation: citationReducer,
    appreciation: appreciationReducer,
    application: applicationReducer,
    clarification: clarificationReducer,
    commandPanel: commandPanelReducer,
    brigade: brigadeReducer,
    master: masterReducer
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
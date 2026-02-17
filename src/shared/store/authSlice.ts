import {PayloadAction, createSlice} from '@reduxjs/toolkit';

type AuthState = {
    accessToken: string | null;
    userId: number | null;
    email: string | null;
};

const loadAuthFromStore = (): AuthState => {
    try {
        const raw = localStorage.getItem('auth');
        if (!raw) {
            return {
                accessToken: null,
                userId: null,
                email: null,
            };
        }
        const parsed = JSON.parse(raw) as AuthState;
        return {
            accessToken: parsed.accessToken ?? null,
            userId: parsed.userId ?? null,
            email: parsed.email ?? null,
        };
    } catch (error) {
        return {
            accessToken: null,
            userId: null,
            email: null,
        };
    }
};

const initialState: AuthState = loadAuthFromStore();

type CredentialsPayload = {
    accessToken: string;
    userId: number;
    email: string;
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials(state, action: PayloadAction<CredentialsPayload>) {
            state.accessToken = action.payload.accessToken;
            state.userId = action.payload.userId;
            state.email = action.payload.email;
            localStorage.setItem(
                'auth',
                JSON.stringify({
                    accessToken: state.accessToken,
                    userId: state.userId,
                    email: state.email,
                }),
            );
        },
        logout(state) {
            state.accessToken = null;
            state.userId = null;
            state.email = null;
            localStorage.removeItem('auth');
        },
    },
});

export const {setCredentials, logout} = authSlice.actions;
export default authSlice.reducer;

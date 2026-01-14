import {PayloadAction, createSlice} from '@reduxjs/toolkit';

type User = {
    id: number;
    email: string;
    email_verified: boolean;
    first_name: string;
    last_name: string;
    avatar_url: string;
    created_at: string;
    updated_at: string;
};

type UserState = {
    data: User | null;
    loading: boolean;
    error: string | null;
};

const initialState: UserState = {
    data: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<User | null>) {
            state.data = action.payload;
            state.error = null;
        },
        setUserLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setUserError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
    },
});

export const {setUser, setUserLoading, setUserError} = userSlice.actions;
export default userSlice.reducer;

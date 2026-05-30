export interface CreateClientPayload {
    first_name: string;
    last_name: string;
    dni: string;
    email: string;
    modules: { code: string }[];
}

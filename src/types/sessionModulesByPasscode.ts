export interface SessionModuleItem {
    id: number;
    name: string | null;
    module_type: string;
    is_active: boolean;
}

export interface SessionModulesByPasscodeResponse {
    modules: SessionModuleItem[];
    active_module: SessionModuleItem | null;
}


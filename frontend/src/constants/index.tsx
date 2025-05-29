export const apiEndPoints = {
    // Auth
    login: '/api/auth/login',
    signUp: '/api/auth/register',
    getProfile: '/api/auth/profile',
    updateUnitProfile: '/api/unit/add-unit-profile',

    // Config
    config: '/api/config',

    // Parameter
    parameter: '/api/parameter',
    parameterEdit: '/api/parameter/:id',

    // Citation
    citation: '/api/citation',

    // Appreciation
    appreciation: '/api/appreciation',

   // Applications
   applicationUnits: '/api/applications/units',
   applicationUnitDetail:'/api/applications/unit-detail',
   applicationSubordinates:'/api/applications/subordinates',

   // Clarification
   clarification: '/api/clarification',

    // Dashboard
    dashboardStats: '/api/dashboard/stats',
};

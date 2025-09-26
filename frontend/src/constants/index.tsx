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
    application: '/api/applications',
    applicationUnits: '/api/applications/units',
    applicationHistory: '/api/applications/history',
    applicationAll: '/api/applications/all',
    applicationUnitDetail: '/api/applications/unit-detail',
    applicationSubordinates: '/api/applications/subordinates',
    applicationAllCount: '/api/applications/all-app-count',

    // Clarification
    clarification: '/api/clarification',

    // Dashboard
    dashboard: '/api/dashboard',
    dashboardStats: '/api/dashboard/stats',
    dashboardUnitScores: '/api/dashboard/unit-scores',

    // Command Panel
    scoreBoard: '/api/applications/scoreboard'
};

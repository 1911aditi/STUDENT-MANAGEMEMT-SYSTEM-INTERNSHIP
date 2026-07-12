// ----------------------------------------------------
// STATISTICAL ANALYSIS HELPER FOR TREND ANALYSIS MODULE
// ----------------------------------------------------

// 1. Matrix operations for Multiple Linear Regression
function transpose(A) {
    const rows = A.length, cols = A[0].length;
    const AT = [];
    for (let j = 0; j < cols; j++) {
        AT[j] = [];
        for (let i = 0; i < rows; i++) {
            AT[j][i] = A[i][j];
        }
    }
    return AT;
}

function multiply(A, B) {
    const rA = A.length, cA = A[0].length, cB = B[0].length;
    const C = [];
    for (let i = 0; i < rA; i++) {
        C[i] = [];
        for (let j = 0; j < cB; j++) {
            let sum = 0;
            for (let k = 0; k < cA; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
    return C;
}

function invert(M) {
    const n = M.length;
    const A = [];
    for (let i = 0; i < n; i++) {
        A[i] = [];
        for (let j = 0; j < n; j++) A[i][j] = M[i][j];
        for (let j = 0; j < n; j++) A[i][j + n] = (i === j) ? 1 : 0;
    }

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let r = i + 1; r < n; r++) {
            if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
        }

        const temp = A[i];
        A[i] = A[maxRow];
        A[maxRow] = temp;

        const pivot = A[i][i];
        if (Math.abs(pivot) < 1e-10) {
            throw new Error('Matrix is singular and cannot be inverted.');
        }

        for (let j = 0; j < 2 * n; j++) A[i][j] /= pivot;

        for (let r = 0; r < n; r++) {
            if (r !== i) {
                const factor = A[r][i];
                for (let j = 0; j < 2 * n; j++) {
                    A[r][j] -= factor * A[i][j];
                }
            }
        }
    }

    const inv = [];
    for (let i = 0; i < n; i++) {
        inv[i] = A[i].slice(n);
    }
    return inv;
}

// 2. Pearson Correlation Coefficient
function calculateCorrelation(X, Y) {
    const n = X.length;
    if (n === 0) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += X[i];
        sumY += Y[i];
        sumXY += X[i] * Y[i];
        sumX2 += X[i] * X[i];
        sumY2 += Y[i] * Y[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return den === 0 ? 0 : num / den;
}

// 3. T-Distribution Approximation to compute p-values
function getPValue(t, df) {
    // Normal approximation for standard cumulative probability
    const x = t * t;
    const a = df / (df + x);
    let p = 1.0;
    
    // Simple numeric integration/approximation for student's t tail
    const absT = Math.abs(t);
    const z = absT / Math.sqrt(df);
    
    // Normal approximation fallback
    const tStat = absT;
    const lpt = 1 / (1 + 0.2316419 * tStat);
    const d = 0.3989423 * Math.exp(-tStat * tStat / 2);
    let prob = 1.0 - d * lpt * (0.3193815 + lpt * (-0.3565638 + lpt * (1.781478 + lpt * (-1.821256 + lpt * 1.330274))));
    
    let twoTail = 2.0 * (1.0 - prob);
    if (twoTail > 1.0) twoTail = 1.0;
    if (twoTail < 0.0001) twoTail = 0.0001;
    return parseFloat(twoTail.toFixed(4));
}

// 4. Multiple Linear Regression Solver (OLS)
function runMultipleRegression(X_matrix, Y_vector) {
    const N = X_matrix.length;
    const k = X_matrix[0].length; // number of independent variables
    
    // Prepend column of 1s to X_matrix for Intercept (beta_0)
    const X = [];
    for (let i = 0; i < N; i++) {
        X[i] = [1, ...X_matrix[i]];
    }

    // Convert Y_vector to N x 1 matrix
    const Y = Y_vector.map(y => [y]);

    try {
        const XT = transpose(X);
        const XTX = multiply(XT, X);
        
        // Add Ridge Regularization (L2 penalty) to prevent singular matrix errors due to multicollinearity
        const lambda = 1e-4;
        for (let i = 0; i < XTX.length; i++) {
            XTX[i][i] += lambda;
        }

        const XTX_inv = invert(XTX);
        const XTY = multiply(XT, Y);
        const beta = multiply(XTX_inv, XTY); // (k+1) x 1 vector of coefficients

        // Extract coefficients
        const coefficients = beta.map(b => b[0]);

        // Calculate fitted values, residuals, and stats metrics
        let sumY = 0;
        for (let i = 0; i < N; i++) sumY += Y_vector[i];
        const meanY = sumY / N;

        let rss = 0; // Residual Sum of Squares
        let tss = 0; // Total Sum of Squares
        let maeSum = 0;
        const Y_fitted = [];

        for (let i = 0; i < N; i++) {
            let fitted = coefficients[0];
            for (let j = 1; j <= k; j++) {
                fitted += coefficients[j] * X_matrix[i][j - 1];
            }
            Y_fitted.push(fitted);
            
            const residual = Y_vector[i] - fitted;
            rss += residual * residual;
            tss += (Y_vector[i] - meanY) * (Y_vector[i] - meanY);
            maeSum += Math.abs(residual);
        }

        const df_res = N - k - 1; // residual degrees of freedom
        const s2 = df_res > 0 ? rss / df_res : 0; // residual variance
        const standardError = Math.sqrt(s2);

        // Standard errors, t-statistics, and p-values for coefficients
        const se = [];
        const t_stats = [];
        const p_values = [];

        for (let j = 0; j <= k; j++) {
            const var_beta_j = s2 * XTX_inv[j][j];
            const se_j = Math.sqrt(var_beta_j);
            se.push(se_j);

            const t_j = se_j === 0 ? 0 : coefficients[j] / se_j;
            t_stats.push(t_j);

            const p_j = df_res > 0 ? getPValue(t_j, df_res) : 0.05;
            p_values.push(p_j);
        }

        const r2 = tss === 0 ? 1 : 1 - (rss / tss);
        const adj_r2 = df_res > 0 && N > 1 ? 1 - ((1 - r2) * (N - 1) / df_res) : r2;
        const rmse = Math.sqrt(rss / N);
        const mae = maeSum / N;

        return {
            success: true,
            coefficients,
            standardErrors: se,
            tStatistics: t_stats,
            pValues: p_values,
            r2,
            adjustedR2: adj_r2,
            rmse,
            mae
        };
    } catch (err) {
        console.error('OLS Regression Error:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

// 5. Forecasting Models
function forecastModels(years, applicants) {
    const N = years.length;
    
    // Fit Linear: Y = a + b * Year
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < N; i++) {
        sumX += years[i];
        sumY += applicants[i];
        sumXY += years[i] * applicants[i];
        sumX2 += years[i] * years[i];
    }
    const b_linear = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
    const a_linear = (sumY - b_linear * sumX) / N;

    // Fit Polynomial (2nd Order): Y = a + b*X + c*X^2
    let a_poly = 0, b_poly = 0, c_poly = 0;
    try {
        const X_poly = years.map(yr => [1, yr, yr * yr]);
        const Y_poly = applicants.map(y => [y]);
        const XPT = transpose(X_poly);
        const XPX = multiply(XPT, X_poly);
        const XPX_inv = invert(XPX);
        const XPY = multiply(XPT, Y_poly);
        const beta_poly = multiply(XPX_inv, XPY);
        a_poly = beta_poly[0][0];
        b_poly = beta_poly[1][0];
        c_poly = beta_poly[2][0];
    } catch (e) {
        console.warn('Polynomial Fit failed, falling back to linear values.');
        a_poly = a_linear; b_poly = b_linear;
    }

    // Fit Exponential: Y = a * e^(b * Year) => ln(Y) = ln(a) + b * Year
    let a_exp = 0, b_exp = 0;
    let sumLnY = 0, sumXLnY = 0;
    for (let i = 0; i < N; i++) {
        const lnY = Math.log(applicants[i] || 1);
        sumLnY += lnY;
        sumXLnY += years[i] * lnY;
    }
    const b_exp_calc = (N * sumXLnY - sumX * sumLnY) / (N * sumX2 - sumX * sumX);
    const a_ln_a = (sumLnY - b_exp_calc * sumX) / N;
    a_exp = Math.exp(a_ln_a);
    b_exp = b_exp_calc;

    // Fit Logistic: Y = L / (1 + e^(-k(X - t_0)))
    // Standard estimation of parameters: Carrying capacity L set to 1.5 * max historical value
    const L = 1.5 * Math.max(...applicants);
    let a_log = 0, b_log = 0; // using linearized transformation: ln((L - Y)/Y) = a - k*X
    let sumTransY = 0, sumXTransY = 0;
    for (let i = 0; i < N; i++) {
        const ratio = (L - applicants[i]) / (applicants[i] || 1);
        const transY = Math.log(ratio > 0 ? ratio : 0.01);
        sumTransY += transY;
        sumXTransY += years[i] * transY;
    }
    const k_log_calc = (N * sumXTransY - sumX * sumTransY) / (N * sumX2 - sumX * sumX);
    const a_log_calc = (sumTransY - k_log_calc * sumX) / N;
    a_log = a_log_calc;
    b_log = k_log_calc;

    // Evaluate models and calculate accuracy (RMSE) on historical data
    const errors = { linear: 0, poly: 0, exp: 0, logistic: 0 };
    for (let i = 0; i < N; i++) {
        const yr = years[i];
        const actual = applicants[i];

        const f_lin = a_linear + b_linear * yr;
        const f_poly = a_poly + b_poly * yr + c_poly * yr * yr;
        const f_exp = a_exp * Math.exp(b_exp * yr);
        const f_log = L / (1 + Math.exp(a_log + b_log * yr));

        errors.linear += (f_lin - actual) * (f_lin - actual);
        errors.poly += (f_poly - actual) * (f_poly - actual);
        errors.exp += (f_exp - actual) * (f_exp - actual);
        errors.logistic += (f_log - actual) * (f_log - actual);
    }

    const rmse = {
        linear: Math.sqrt(errors.linear / N),
        poly: Math.sqrt(errors.poly / N),
        exp: Math.sqrt(errors.exp / N),
        logistic: Math.sqrt(errors.logistic / N)
    };

    // Find best model based on lowest RMSE
    let bestModel = 'linear';
    let minRmse = rmse.linear;
    for (const model of ['poly', 'exp', 'logistic']) {
        if (rmse[model] < minRmse) {
            minRmse = rmse[model];
            bestModel = model;
        }
    }

    // Predict next 5 years (2027 to 2031)
    const forecastYears = [2027, 2028, 2029, 2030, 2031];
    const predictions = {
        years: forecastYears,
        linear: forecastYears.map(yr => Math.round(a_linear + b_linear * yr)),
        poly: forecastYears.map(yr => Math.round(a_poly + b_poly * yr + c_poly * yr * yr)),
        exp: forecastYears.map(yr => Math.round(a_exp * Math.exp(b_exp * yr))),
        logistic: forecastYears.map(yr => Math.round(L / (1 + Math.exp(a_log + b_log * yr))))
    };

    return {
        rmse,
        bestModel,
        predictions
    };
}

module.exports = {
    calculateCorrelation,
    runMultipleRegression,
    forecastModels
};

/**
 * Multi-Auth Context - Supports multiple role logins in one browser
 * Stores tokens separately by role: admin_token, employee_token, trader_token
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";

const MultiAuthContext = createContext(undefined);

export const MultiAuthProvider = ({ children }) => {
  const [auths, setAuths] = useState({
    admin: { user: null, token: null },
    employee: { user: null, token: null },
    trader: { user: null, token: null },
    client: { user: null, token: null }
  });
  const [activeRole, setActiveRole] = useState(null); // Track the most recently logged-in role
  const [loading, setLoading] = useState(true);

  // Load all stored auths on mount
  useEffect(() => {
    const loadStoredAuths = () => {
      const storedAuths = {
        admin: {
          token: localStorage.getItem('admin_token'),
          user: localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')) : null
        },
        employee: {
          token: localStorage.getItem('employee_token'),
          user: localStorage.getItem('employee_user') ? JSON.parse(localStorage.getItem('employee_user')) : null
        },
        trader: {
          token: localStorage.getItem('trader_token'),
          user: localStorage.getItem('trader_user') ? JSON.parse(localStorage.getItem('trader_user')) : null
        },
        client: {
          token: localStorage.getItem('client_token'),
          user: localStorage.getItem('client_user') ? JSON.parse(localStorage.getItem('client_user')) : null
        }
      };
      setAuths(storedAuths);
      
      // Restore active role from localStorage if available
      const storedActiveRole = localStorage.getItem('active_role');
      if (storedActiveRole && storedAuths[storedActiveRole]?.user && storedAuths[storedActiveRole]?.token) {
        setActiveRole(storedActiveRole);
      }
    };

    loadStoredAuths();
    setLoading(false);
  }, []);

  // Login function that stores by role
  const login = async (email, password, requestedRole = null) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const responseData = response.data.data || response.data;
      const primaryToken = responseData.token || responseData.accessToken;
      const primaryUser = responseData.user || responseData;

      // Determine role: prioritize requested role, then check roleTokens, then primary user role
      let selectedRole = requestedRole;
      let selectedToken = primaryToken;
      let selectedUser = primaryUser;
      let selectedUserRole = primaryUser.userType || primaryUser.role;

      // SECURITY: Validate that requested role matches user's actual role
      if (requestedRole) {
        const requestedRoleUpper = requestedRole.toUpperCase();
        const availableRoles = responseData.availableRoles || [];
        const primaryRole = (primaryUser.userType || primaryUser.role || '').toUpperCase();
        
        // Check if requested role is available
        if (!availableRoles.includes(requestedRoleUpper) && primaryRole !== requestedRoleUpper) {
          throw new Error(`You do not have access to ${requestedRole} role. Available roles: ${availableRoles.join(', ')}`);
        }
      }

      // If roleTokens exist and user requested a specific role, use that role's token
      if (requestedRole && responseData.roleTokens) {
        const requestedRoleUpper = requestedRole.toUpperCase();
        const roleToken = responseData.roleTokens[requestedRoleUpper];
        const roleProfile = responseData.roleProfiles?.[requestedRoleUpper] || 
                          responseData.linkedProfiles?.find(
                            p => p.userType === requestedRoleUpper
                          ) ||
                          (requestedRoleUpper === selectedUserRole ? primaryUser : null);
        
        if (roleToken && roleProfile) {
          // User requested a specific role and we have a token for it
          selectedToken = roleToken;
          selectedUser = roleProfile;
          selectedUserRole = requestedRoleUpper;
        } else if (responseData.availableRoles && responseData.availableRoles.includes(requestedRoleUpper)) {
          // Requested role exists but no separate token - use primary token but set role correctly
          selectedUserRole = requestedRoleUpper;
        }
      }

      // Normalize role to our storage keys
      const roleKey = normalizeRole(selectedUserRole || requestedRole);
      
      if (!roleKey) {
        throw new Error('Unknown user role');
      }
      
      // SECURITY: Final validation - ensure role matches
      if (requestedRole && roleKey !== requestedRole) {
        console.warn(`Role mismatch: requested ${requestedRole}, got ${roleKey}`);
      }

      // Store auth for the selected role
      const roleTokenKey = `${roleKey}_token`;
      const roleUserKey = `${roleKey}_user`;
      
      localStorage.setItem(roleTokenKey, selectedToken);
      localStorage.setItem(roleUserKey, JSON.stringify({ ...selectedUser, userType: selectedUserRole }));

      // Update state
      const updatedAuths = {
        ...auths,
        [roleKey]: { user: { ...selectedUser, userType: selectedUserRole }, token: selectedToken }
      };

      // Handle linked profiles and multiple roles - store ALL available roles
      if (responseData.roleTokens) {
        for (const [roleType, roleToken] of Object.entries(responseData.roleTokens)) {
          const linkedRoleKey = normalizeRole(roleType);
          if (linkedRoleKey && linkedRoleKey !== roleKey) {
            // Find the profile data for this role
            const linkedProfile = responseData.roleProfiles?.[roleType] || 
                                responseData.linkedProfiles?.find(
                                  p => p.userType === roleType
                                ) ||
                                (roleType === primaryUser.userType ? primaryUser : null);
            
            if (linkedProfile) {
              const linkedTokenKey = `${linkedRoleKey}_token`;
              const linkedUserKey = `${linkedRoleKey}_user`;
              
              localStorage.setItem(linkedTokenKey, roleToken);
              localStorage.setItem(linkedUserKey, JSON.stringify(linkedProfile));
              
              updatedAuths[linkedRoleKey] = { 
                user: linkedProfile, 
                token: roleToken 
              };
            }
          }
        }
      } else if (responseData.availableRoles && responseData.availableRoles.length > 1) {
        // Fallback: Multiple roles available but no separate tokens
        for (const availableRole of responseData.availableRoles) {
          const linkedRoleKey = normalizeRole(availableRole);
          if (linkedRoleKey && linkedRoleKey !== roleKey) {
            const linkedProfile = responseData.linkedProfiles?.find(
              p => p.userType === availableRole
            ) || (availableRole === primaryUser.userType ? primaryUser : null);
            
            if (linkedProfile) {
              const linkedTokenKey = `${linkedRoleKey}_token`;
              const linkedUserKey = `${linkedRoleKey}_user`;
              
              // Use primary token for linked roles if no separate token
              localStorage.setItem(linkedTokenKey, primaryToken);
              localStorage.setItem(linkedUserKey, JSON.stringify(linkedProfile));
              
              updatedAuths[linkedRoleKey] = { 
                user: linkedProfile, 
                token: primaryToken 
              };
            }
          }
        }
      }

      setAuths(updatedAuths);

      // Set active role to the requested role (or selected role), not the primary role from backend
      const activeRoleKey = normalizeRole(requestedRole) || roleKey;
      setActiveRole(activeRoleKey);
      localStorage.setItem('active_role', activeRoleKey);

      return { 
        user: { ...selectedUser, userType: selectedUserRole }, 
        token: selectedToken, 
        role: activeRoleKey, 
        availableRoles: responseData.availableRoles || [selectedUserRole] 
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // Logout specific role
  const logout = (role = null) => {
    if (role) {
      const roleKey = normalizeRole(role);
      localStorage.removeItem(`${roleKey}_token`);
      localStorage.removeItem(`${roleKey}_user`);
      setAuths(prev => ({
        ...prev,
        [roleKey]: { user: null, token: null }
      }));
      // Clear active role if it's the one being logged out
      if (activeRole === roleKey) {
        setActiveRole(null);
        localStorage.removeItem('active_role');
      }
    } else {
      // Logout all
      ['admin', 'employee', 'trader', 'client'].forEach(roleKey => {
        localStorage.removeItem(`${roleKey}_token`);
        localStorage.removeItem(`${roleKey}_user`);
      });
      setAuths({
        admin: { user: null, token: null },
        employee: { user: null, token: null },
        trader: { user: null, token: null },
        client: { user: null, token: null }
      });
      setActiveRole(null);
      localStorage.removeItem('active_role');
    }
  };

  // Normalize role to our storage keys - memoized (must be defined before use)
  const normalizeRole = useCallback((role) => {
    if (!role) return null;
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN') return 'admin';
    if (roleUpper === 'EMPLOYEE') return 'employee';
    if (roleUpper === 'TRADER') return 'trader';
    if (roleUpper === 'CLIENT' || roleUpper === 'USER') return 'client';
    return null;
  }, []);

  // Check if user is logged in for a role - memoized
  const isLoggedIn = useCallback((role) => {
    const roleKey = normalizeRole(role);
    return !!auths[roleKey]?.user && !!auths[roleKey]?.token;
  }, [auths, normalizeRole]);

  // Get current auth for a role - memoized to prevent hook order changes
  const getAuth = useCallback((role) => {
    const roleKey = normalizeRole(role);
    return auths[roleKey] || { user: null, token: null };
  }, [auths, normalizeRole]);

  // Get active token for API calls (prioritizes current role) - memoized
  const getActiveToken = useCallback((preferredRole = null) => {
    if (preferredRole) {
      const roleKey = normalizeRole(preferredRole);
      return auths[roleKey]?.token;
    }
    // Return first available token
    return auths.admin?.token || 
           auths.employee?.token || 
           auths.trader?.token || 
           auths.client?.token;
  }, [auths, normalizeRole]);

  // Role checkers - memoized to prevent infinite re-renders
  const isAdmin = useCallback(() => isLoggedIn('admin'), [isLoggedIn]);
  const isEmployee = useCallback(() => isLoggedIn('employee'), [isLoggedIn]);
  const isTrader = useCallback(() => isLoggedIn('trader'), [isLoggedIn]);
  const isClient = useCallback(() => isLoggedIn('client'), [isLoggedIn]);

  // Get all logged in roles - memoized
  const getActiveRoles = useCallback(() => {
    const roles = [];
    if (isLoggedIn('admin')) roles.push('admin');
    if (isLoggedIn('employee')) roles.push('employee');
    if (isLoggedIn('trader')) roles.push('trader');
    if (isLoggedIn('client')) roles.push('client');
    return roles;
  }, [isLoggedIn]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    auths,
    loading,
    activeRole,
    setActiveRole,
    login,
    logout,
    getAuth,
    getActiveToken,
    isLoggedIn,
    isAdmin,
    isEmployee,
    isTrader,
    isClient,
    getActiveRoles
  }), [auths, loading, activeRole, isAdmin, isEmployee, isTrader, isClient, getActiveRoles, getAuth, getActiveToken, isLoggedIn, login, logout, setActiveRole]);

  return (
    <MultiAuthContext.Provider value={contextValue}>
      {children}
    </MultiAuthContext.Provider>
  );
};

export const useMultiAuth = () => {
  const context = useContext(MultiAuthContext);
  if (context === undefined) {
    throw new Error("useMultiAuth must be used within a MultiAuthProvider");
  }
  return context;
};


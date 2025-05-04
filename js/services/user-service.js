// 사용자 정보 및 역할 관리
window.userService = {
  user: null,
  async loadUser() {
    this.user = await window.supabaseClient.getUser();
    return this.user;
  },
  getRole() {
    return this.user?.role || 'attendee';
  },
  setRole(role) {
    if (window.APP_CONFIG.ROLES.includes(role)) {
      this.user = { ...this.user, role };
    }
  }
};

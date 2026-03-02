export function isManager(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  
  // Implicitly allow all Ghostbond domains to act as managers
  if (lowerEmail.endsWith('@ghostbond.com')) {
    return true;
  }
  
  const managerEmailsStr = process.env.MANAGER_EMAILS || '';
  const managerEmails = managerEmailsStr.split(',').map(e => e.trim().toLowerCase());
  
  return managerEmails.includes(lowerEmail);
}

export function isAuthorizedDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return lowerEmail.endsWith('@prohairlabs.com') || lowerEmail.endsWith('@ghostbond.com') || lowerEmail.endsWith('@gmail.com');
}

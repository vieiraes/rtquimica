// Mensagens do Supabase Auth em português, para a pessoa entender o que fazer.
const MENSAGENS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/user is banned/i, "Seu acesso foi desativado. Fale com o titular do escritório."],
  [/email not confirmed/i, "Confirme o seu e-mail pelo link que enviamos antes de entrar."],
  [/user already registered/i, "Esse e-mail já tem conta. Use Entrar ou Esqueci minha senha."],
  [/password should be at least/i, "A senha precisa de pelo menos 6 caracteres."],
  [/new password should be different/i, "A nova senha precisa ser diferente da anterior."],
  [/rate limit|too many requests|for security purposes/i, "Muitas tentativas seguidas. Espere um pouco e tente de novo."],
  [/unable to validate email|invalid email/i, "E-mail inválido."],
  [/failed to fetch|network/i, "Sem conexão com o servidor. Confira a internet e tente de novo."],
];

export function traduzirErroAuth(mensagem: string | undefined): string {
  if (!mensagem) return "Não consegui entrar agora. Tente de novo.";
  return MENSAGENS.find(([re]) => re.test(mensagem))?.[1] ?? "Não consegui entrar agora. Tente de novo.";
}

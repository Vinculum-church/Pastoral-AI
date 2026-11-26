import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, PastoralType } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string, pastoralType?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  getSessionToken: () => Promise<string | null>;
  updateUserAvatar: (avatarUrl: string) => void;
  updateUserFoto: (url: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleMap: Record<string, UserRole> = {
  coordenador: UserRole.COORDENADOR,
  lider: UserRole.LIDER,
  admin: UserRole.ADMIN,
  'administrador paroquial': UserRole.ADMIN,
  administrador: UserRole.ADMIN,
};

function resolveRole(profileRole: unknown): UserRole {
  // Postgres enum pode vir como string ou objeto
  const raw = profileRole != null && typeof profileRole === 'object' && 'value' in (profileRole as object)
    ? (profileRole as { value: string }).value
    : profileRole;
  const r = String(raw ?? '').toLowerCase().trim();
  
  // Verificação direta no mapa
  if (roleMap[r]) return roleMap[r];
  
  // Fallback: se contém "admin" em qualquer variação
  if (r.includes('admin')) return UserRole.ADMIN;
  if (r.includes('coord')) return UserRole.COORDENADOR;
  
  return UserRole.LIDER;
}

function mapProfileToUser(profile: any, email: string): User {
  const savedAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem(`user_avatar_${profile.id}`) : null;
  return {
    id: profile.id,
    name: profile.nome || email.split('@')[0],
    email: email,
    role: resolveRole(profile.role),
    parish_id: profile.paroquia_id || '',
    paroquia: profile.paroquia_nome || 'Paróquia',
    comunidade_id: profile.comunidade_id || '',
    comunidade: profile.comunidade_nome || '',
    pastoral_type: (profile.pastoral_type as PastoralType) || PastoralType.CATEQUESE,
    avatar: savedAvatar || profile.nome?.charAt(0) || 'U',
    foto_url: profile.foto_url || '',
  };
}

/** Usuário mínimo quando o perfil ainda não existe na tabela profiles (ex.: logo após cadastro). */
function authUserToMinimalUser(userId: string, email: string): User {
  const name = email.split('@')[0];
  return {
    id: userId,
    name,
    email,
    role: UserRole.LIDER,
    parish_id: '',
    paroquia: 'Paróquia',
    comunidade_id: '',
    comunidade: '',
    pastoral_type: PastoralType.CATEQUESE,
    avatar: name.charAt(0).toUpperCase() || 'U',
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (!useSupabase || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 15000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      try {
        if (session?.user) {
          const email = session.user.email || '';
          const profile = await fetchProfile(session.user.id);
          if (cancelled) return;
          if (profile) {
            setUser(mapProfileToUser(profile, email));
          } else {
            setUser(authUserToMinimalUser(session.user.id, email));
          }
        }
      } catch (_) {
        if (session?.user) {
          setUser(authUserToMinimalUser(session.user.id, session.user.email || ''));
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    }).catch(() => {
      if (!cancelled) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const email = session.user.email || '';
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(mapProfileToUser(profile, email));
          } else {
            setUser(prev => {
              if (prev && prev.id === session.user.id && (prev.parish_id || prev.comunidade_id)) {
                return prev;
              }
              return authUserToMinimalUser(session.user.id, email);
            });
          }
        } else {
          setUser(null);
        }
      } catch (_) {
        setUser(prev => {
          if (session?.user && prev && prev.id === session.user.id && (prev.parish_id || prev.comunidade_id)) {
            return prev;
          }
          if (session?.user) {
            return authUserToMinimalUser(session.user.id, session.user.email || '');
          }
          return null;
        });
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Busca o perfil com até 3 tentativas. Se o banco demorar (ex.: projeto "acordando")
   * ou a junção com paróquia/comunidade falhar, busca os nomes separadamente.
   * Se tudo falhar, usa a última cópia boa salva neste aparelho — assim a
   * paróquia e a comunidade não "somem" por causa de uma falha de conexão.
   */
  async function fetchProfile(userId: string) {
    if (!supabase) return null;
    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
    const comTempo = <T,>(p: PromiseLike<T>, ms: number) => Promise.race([p, timeout(ms)]) as Promise<T | null>;

    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        let profile: any = null;
        const r: any = await comTempo(
          supabase
            .from('profiles')
            .select('id, nome, email, role, paroquia_id, comunidade_id, pastoral_type, paroquias ( nome ), comunidades ( nome )')
            .eq('id', userId)
            .maybeSingle(),
          10000,
        );
        if (r && !r.error) {
          profile = r.data;
        } else if (r?.error) {
          // Junção falhou: busca o perfil puro e os nomes à parte
          const p: any = await comTempo(supabase.from('profiles').select('*').eq('id', userId).maybeSingle(), 10000);
          if (p && !p.error) profile = p.data;
        }
        if (r && !r.error && !r.data) return null; // perfil realmente não existe
        if (profile) {
          let paroquia_nome = profile.paroquias?.nome || '';
          let comunidade_nome = profile.comunidades?.nome || '';
          if (!paroquia_nome && profile.paroquia_id) {
            const q: any = await comTempo(supabase.from('paroquias').select('nome').eq('id', profile.paroquia_id).maybeSingle(), 6000);
            paroquia_nome = q?.data?.nome || '';
          }
          if (!comunidade_nome && profile.comunidade_id) {
            const q: any = await comTempo(supabase.from('comunidades').select('nome').eq('id', profile.comunidade_id).maybeSingle(), 6000);
            comunidade_nome = q?.data?.nome || '';
          }
          // foto_url é buscada à parte: se a coluna ainda não existir, o login não quebra
          let foto_url = profile.foto_url || '';
          if (!foto_url) {
            try {
              const f: any = await comTempo(supabase.from('profiles').select('foto_url').eq('id', userId).maybeSingle(), 5000);
              foto_url = f?.data?.foto_url || '';
            } catch (_) {}
          }
          const completo = {
            ...profile,
            foto_url,
            paroquia_nome: paroquia_nome || 'Paróquia',
            comunidade_nome,
            comunidade_id: profile.comunidade_id || null,
          };
          try { localStorage.setItem(`pastoriai_perfil_${userId}`, JSON.stringify(completo)); } catch (_) {}
          return completo;
        }
      } catch (_) {}
      await new Promise(res => setTimeout(res, 800 * (tentativa + 1)));
    }

    // Sem conexão com o banco: usa a última cópia boa deste aparelho
    try {
      const salvo = localStorage.getItem(`pastoriai_perfil_${userId}`);
      if (salvo) return JSON.parse(salvo);
    } catch (_) {}
    return null;
  }

  const login = async (email: string, password: string, role?: string, pastoralType?: string): Promise<{ success: boolean; error?: string }> => {
    if (!useSupabase) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const foundUser = MOCK_USERS[email];
      if (foundUser) {
        if (role) foundUser.role = roleMap[role] || foundUser.role;
        if (pastoralType) foundUser.pastoral_type = pastoralType as PastoralType;
        setUser(foundUser);
        return { success: true };
      }
      return { success: false, error: 'E-mail não encontrado. Tente "coord@paroquia.com" ou "cat@paroquia.com".' };
    }

    if (!supabase) return { success: false, error: 'Supabase não configurado.' };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message === 'Email not confirmed'
          ? 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada (e o spam).'
          : error.message;
      return { success: false, error: msg };
    }

    if (data.user) {
      try {
        const profile = await fetchProfile(data.user.id);
        if (profile) {
          const mappedUser = mapProfileToUser(profile, email);
          // Coordenador e líder: pastoral_type SEMPRE do perfil (segmento atribuído no cadastro)
          // Admin: pode usar o selecionado no login
          if (pastoralType && mappedUser.role === UserRole.ADMIN) {
            mappedUser.pastoral_type = pastoralType as PastoralType;
          }
          setUser(mappedUser);
        } else {
          const minUser = authUserToMinimalUser(data.user.id, email);
          if (pastoralType) minUser.pastoral_type = pastoralType as PastoralType;
          setUser(minUser);
        }
      } catch (_) {
        const minUser = authUserToMinimalUser(data.user.id, email);
        if (pastoralType) minUser.pastoral_type = pastoralType as PastoralType;
        setUser(minUser);
      }
    }

    return { success: true };
  };

  const updateUserFoto = async (url: string) => {
    if (!user) return { success: false, error: 'Sem usuário.' };
    if (supabase && useSupabase) {
      const { error } = await supabase.from('profiles').update({ foto_url: url || null }).eq('id', user.id);
      if (error) return { success: false, error: error.message };
    }
    setUser(prev => (prev ? { ...prev, foto_url: url } : prev));
    return { success: true };
  };

  const getSessionToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const updateUserAvatar = (avatarUrl: string) => {
    setUser(prev => {
      if (!prev) return null;
      localStorage.setItem(`user_avatar_${prev.id}`, avatarUrl);
      return { ...prev, avatar: avatarUrl };
    });
  };

  const logout = async () => {
    try {
      if (useSupabase && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro ao fazer signOut:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, getSessionToken, updateUserAvatar, updateUserFoto }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

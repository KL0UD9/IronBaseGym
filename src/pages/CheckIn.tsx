import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, Dumbbell, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_memberships: Array<{
    status: string;
    end_date: string;
  }>;
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MemberResult[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);
  const [flashStatus, setFlashStatus] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);

  const searchMembers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        user_memberships (
          status,
          end_date
        )
      `)
      .eq('role', 'member')
      .ilike('full_name', `%${query}%`)
      .limit(10);

    if (error) {
      console.error('Search error:', error);
    } else {
      setResults((data as MemberResult[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchMembers(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, searchMembers]);

  const handleSelectMember = (member: MemberResult) => {
    setSelectedMember(member);
    setResults([]);
    setSearchQuery('');

    const activeMembership = member.user_memberships?.[0];
    const isActive = activeMembership?.status === 'active';

    setFlashStatus(isActive ? 'success' : 'error');

    // Reset after animation
    setTimeout(() => {
      setFlashStatus(null);
      setSelectedMember(null);
    }, 3000);
  };

  const activeMembership = selectedMember?.user_memberships?.[0];
  const isActive = activeMembership?.status === 'active';

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-300",
      flashStatus === 'success' && "flash-success",
      flashStatus === 'error' && "flash-error"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <Dumbbell className="h-12 w-12 text-primary" />
        <span className="text-4xl font-bold gradient-text">IronBase</span>
      </div>

      {/* Check-in Status Display */}
      {selectedMember && (
        <div className={cn(
          "fixed inset-0 flex items-center justify-center z-50 bg-background/95 backdrop-blur-sm animate-scale-in"
        )}>
          <div className="text-center space-y-6">
            {isActive ? (
              <>
                <div className="mx-auto w-32 h-32 rounded-full bg-success/20 flex items-center justify-center neon-glow-success">
                  <CheckCircle className="h-20 w-20 text-success" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-success mb-2">Access Granted</h1>
                  <p className="text-2xl text-muted-foreground">
                    Welcome, {selectedMember.full_name}!
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center neon-glow-destructive">
                  <XCircle className="h-20 w-20 text-destructive" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-destructive mb-2">Payment Required</h1>
                  <p className="text-2xl text-muted-foreground">
                    {selectedMember.full_name}, your membership has expired
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Box */}
      {!selectedMember && (
        <div className="w-full max-w-2xl space-y-4">
          <h2 className="text-2xl font-semibold text-center mb-8">Member Check-In</h2>
          
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" />
            <Input
              placeholder="Search member by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-20 pl-20 text-2xl rounded-2xl border-2 border-border focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
              {results.map((member) => {
                const membershipStatus = member.user_memberships?.[0]?.status;
                const isActiveMember = membershipStatus === 'active';

                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className="text-xl font-medium">{member.full_name}</span>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium",
                      isActiveMember 
                        ? "bg-success/20 text-success" 
                        : "bg-destructive/20 text-destructive"
                    )}>
                      {isActiveMember ? 'Active' : 'Expired'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <p className="text-center text-muted-foreground">Searching...</p>
          )}

          {searchQuery.length >= 2 && results.length === 0 && !loading && (
            <p className="text-center text-muted-foreground">No members found</p>
          )}
        </div>
      )}
    </div>
  );
}

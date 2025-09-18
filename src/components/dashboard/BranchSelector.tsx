import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useBranch } from '@/contexts/BranchContext';
import { useNavigate } from 'react-router-dom';

export function BranchSelector() {
  const { currentBranch, userBranches, switchBranch } = useBranch();
  const navigate = useNavigate();

  // Only show if user has multiple branches or none selected
  if (!currentBranch || userBranches.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {currentBranch.restaurant.name}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select Restaurant Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => switchBranch(branch.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{branch.restaurant.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {branch.role}
              </span>
            </div>
            {branch.is_default && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
            {currentBranch?.id === branch.id && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate('/branch-management')}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Manage Branches
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
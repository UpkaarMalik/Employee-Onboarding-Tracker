import { IsInt, Min, Max } from 'class-validator';

export class HeartbeatDto {
  // Seconds of active focus time since the LAST heartbeat call, not
  // cumulative — the backend adds this to the running total. Capped at
  // a sane max per call so a single malformed/malicious ping can't jump
  // the counter arbitrarily.
  @IsInt()
  @Min(1)
  @Max(60)
  activeSeconds!: number;
}
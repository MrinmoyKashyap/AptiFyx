import { create } from 'zustand';
import { Job, IncomingJobNotification, Service } from '../types';

interface JobState {
  // Customer state
  activeJob: Job | null;
  jobOtp: string | null;
  broadcastRadius: number;
  providersNotified: number;

  // Provider state
  incomingJobs: IncomingJobNotification[];
  currentProviderJob: Job | null;
  canAcceptJobs: boolean;

  // Shared
  services: Service[];

  // Customer actions
  setActiveJob: (job: Job | null) => void;
  setJobOtp: (otp: string | null) => void;
  setBroadcastStatus: (radius: number, notified: number) => void;
  updateJobStatus: (status: Job['status']) => void;

  // Provider actions
  addIncomingJob: (job: IncomingJobNotification) => void;
  removeIncomingJob: (jobId: string) => void;
  clearIncomingJobs: () => void;
  setCurrentProviderJob: (job: Job | null) => void;
  setCanAcceptJobs: (can: boolean) => void;

  // Shared
  setServices: (services: Service[]) => void;
}

export const useJobStore = create<JobState>((set) => ({
  activeJob: null,
  jobOtp: null,
  broadcastRadius: 0,
  providersNotified: 0,
  incomingJobs: [],
  currentProviderJob: null,
  canAcceptJobs: true,
  services: [],

  setActiveJob: (job) => set({ activeJob: job }),
  setJobOtp: (otp) => set({ jobOtp: otp }),
  setBroadcastStatus: (radius, notified) =>
    set({ broadcastRadius: radius, providersNotified: notified }),
  updateJobStatus: (status) =>
    set((state) => ({
      activeJob: state.activeJob ? { ...state.activeJob, status } : null,
    })),

  addIncomingJob: (job) =>
    set((state) => ({
      incomingJobs: [job, ...state.incomingJobs.filter((j) => j.jobId !== job.jobId)],
    })),
  removeIncomingJob: (jobId) =>
    set((state) => ({
      incomingJobs: state.incomingJobs.filter((j) => j.jobId !== jobId),
    })),
  clearIncomingJobs: () => set({ incomingJobs: [] }),
  setCurrentProviderJob: (job) => set({ currentProviderJob: job }),
  setCanAcceptJobs: (can) => set({ canAcceptJobs: can }),

  setServices: (services) => set({ services }),
}));

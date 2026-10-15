import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Plot, PlotInput } from '@workspace/api-client-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type PlotFormValues = {
  name: string;
  crop: string;
  location: string;
  areaHectares: string;
};

type PlotFormDialogProps = {
  open: boolean;
  plot: Plot | null;
  pending: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PlotInput) => void;
};

export function PlotFormDialog({
  open,
  plot,
  pending,
  errorMessage,
  onOpenChange,
  onSubmit,
}: PlotFormDialogProps) {
  const form = useForm<PlotFormValues>({
    defaultValues: {
      name: '',
      crop: '',
      location: '',
      areaHectares: '',
    },
  });
  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset({
      name: plot?.name ?? '',
      crop: plot?.crop ?? '',
      location: plot?.location ?? '',
      areaHectares: plot ? String(plot.areaHectares) : '',
    });
  }, [open, plot?.id, plot?.name, plot?.crop, plot?.location, plot?.areaHectares, reset]);

  const submit = (values: PlotFormValues) => {
    onSubmit({
      name: values.name.trim(),
      crop: values.crop.trim(),
      location: values.location.trim(),
      areaHectares: Number(values.areaHectares),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#e6dfd0] bg-[#fbf9f2] text-[#284333] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">
            {plot ? 'Edit plot details' : 'Add a field plot'}
          </DialogTitle>
          <DialogDescription className="text-[#718075]">
            {plot
              ? 'Update the plot information shown to your field team.'
              : 'Add the field details now. Moisture readings will appear when sensor data is available.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                rules={{
                  required: 'Enter a plot name.',
                  validate: (value) =>
                    value.trim().length > 0 || 'Enter a plot name.',
                  maxLength: { value: 80, message: 'Use 80 characters or fewer.' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plot name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-plot-name"
                        placeholder="e.g. Bangura market garden"
                        maxLength={80}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crop"
                rules={{
                  required: 'Enter the crop.',
                  validate: (value) => value.trim().length > 0 || 'Enter the crop.',
                  maxLength: { value: 80, message: 'Use 80 characters or fewer.' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-plot-crop"
                        placeholder="e.g. Tomatoes"
                        maxLength={80}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                rules={{
                  required: 'Enter a location.',
                  validate: (value) =>
                    value.trim().length > 0 || 'Enter a location.',
                  maxLength: { value: 120, message: 'Use 120 characters or fewer.' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-plot-location"
                        placeholder="e.g. Regent"
                        maxLength={120}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="areaHectares"
                rules={{
                  required: 'Enter the plot area.',
                  validate: (value) => {
                    const area = Number(value);
                    return (
                      (Number.isFinite(area) && area > 0 && area <= 10000) ||
                      'Enter an area greater than zero and no more than 10,000 hectares.'
                    );
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area (hectares)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-plot-area"
                        type="number"
                        min="0.01"
                        max="10000"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="e.g. 0.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {errorMessage && (
              <p role="alert" data-testid="text-plot-save-error" className="text-sm font-medium text-[#a34832]">
                {errorMessage}
              </p>
            )}

            <DialogFooter className="gap-2">
              <button
                type="button"
                data-testid="button-cancel-plot"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border border-[#ded8c9] px-4 py-2.5 text-sm font-semibold text-[#5f7061] hover:bg-[#f1eee5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="button-save-plot"
                disabled={pending}
                className="rounded-xl bg-[#234a37] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#193c2b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Saving…' : plot ? 'Save changes' : 'Add plot'}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

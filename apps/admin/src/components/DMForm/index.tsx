import { Form, message, Space, Button, Modal, Drawer, type ModalProps, type DrawerProps } from 'antd';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePubSubListener from '../../hooks/usePubSubListener';
import ChildrenWrapper from './_components/ChildrenWrapper';
import useNormalizedProps from './_hooks/useNormalizedProps';
import type {
  DMFormProps,
  DMFormContextConfig,
  DMFormRenderFooterProps,
  DMFormRunConfig,
  DMFormBeforeShowCloseProps,
} from './types';

export default function DMForm<T = Record<string, unknown>>(props: DMFormProps<T>) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    renderFooter = ({
      form: _form, // eslint-disable-line @typescript-eslint/no-unused-vars
      submit,
      reset,
      loading,
    }: DMFormRenderFooterProps) => (
      <Space>
        <Button
          type="primary"
          loading={loading}
          style={{
            minWidth: 75,
          }}
          onClick={() => {
            submit();
          }}
        >
          {t('save')}
        </Button>

        <Button
          style={{
            minWidth: 75,
          }}
          onClick={() => {
            reset();
          }}
        >
          {t('cancel')}
        </Button>
      </Space>
    ),
    name,
    form,
    submitAsync,
    reset,
    children,
    renderChildren,
    type = 'Drawer', // Drawer 或 Modal
    trigger,
    beforeShow = ({ resolve }: DMFormBeforeShowCloseProps): void => {
      resolve();
    },
    beforeClose = ({ resolve }: DMFormBeforeShowCloseProps): void => {
      resolve();
    },
    title,
    width = 416,
    closable = true,
    onClose,
    dmConfig = {},
    unsavedWarning = true,
    requestInitialValues,
    requestDeps,
    ...rest
  } = useNormalizedProps<T>(props as Omit<DMFormProps<T>, 'onReset'> & { onReset?: () => void });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const newSubmit = (submitParams?: Record<string, unknown>) => {
    setLoading(true);
    return submitAsync(submitParams)
      .then(() => {
        setOpen(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const newReset = (newInitialValues?: Record<string, unknown>) => {
    return new Promise<void>((resolve, reject) => {
      beforeClose({
        resolve: () => resolve(undefined),
        reject: () => reject()
      });
    }).then(() => {
      reset(newInitialValues);
      setOpen(false);
    });
  };

  const contextConfig: DMFormContextConfig = {
    form,
    submit: newSubmit,
    reset: newReset,
    loading,
  };

  usePubSubListener({
    name: `${name}.run()`,
    callback: (config: unknown) => {
      const runConfig = config as DMFormRunConfig;
      if (runConfig && typeof runConfig === 'object' && 'visible' in runConfig) {
        setOpen(runConfig.visible ?? false);
      }
      if (runConfig?.submit) {
        contextConfig.submit(runConfig.submitParams);
      }
      if (runConfig?.reset) {
        contextConfig.reset(runConfig.resetParams);
      }
    },
  });

  usePubSubListener({
    name: 'DMForm.destroyAll()',
    callback: () => {
      setOpen(false);
    },
  });

  const isWarnedBeforeCloseRef = useRef(false);

  const renderTrigger = () => {
    if (trigger) {
      const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        new Promise<void>((resolve, reject) => {
          beforeShow({
            resolve: () => resolve(undefined),
            reject: () => reject()
          });
        }).then(() => {
          setOpen(true);
        });
      };

      if (typeof trigger === 'function') {
        return trigger({ onClick });
      }

      return <span onClick={onClick}>{trigger}</span>;
    }

    return null;
  };

  const handleClose: DrawerProps['onClose'] = (e) => {
    if (
      unsavedWarning &&
      form.isFieldsTouched() &&
      e &&
      e.target &&
      (e.target as HTMLElement).nodeName.toUpperCase() === 'DIV' &&
      !isWarnedBeforeCloseRef.current
    ) {
      message.warning({
        key: 'KEY_FORM',
        content: t('unsavedData'),
        duration: 3,
      });
      isWarnedBeforeCloseRef.current = true;
      setTimeout(() => {
        isWarnedBeforeCloseRef.current = false;
      }, 1500);
    } else {
      newReset(undefined).then(() => {
        if (onClose) {
          onClose();
        }
      });
    }
  };

  const formContent = (
    <Form {...rest} name={name} form={form}>
      {open && (
        <ChildrenWrapper
          form={form}
          initialValues={props.initialValues}
          requestInitialValues={requestInitialValues}
          requestDeps={requestDeps}
        >
          {renderChildren ? (
            renderChildren(contextConfig)
          ) : (
            <>
              {children}
              {renderFooter && (
                <Form.Item shouldUpdate noStyle>
                  {() => (
                    <>
                      <div style={{ position: 'relative', height: 30, width: '100%' }}></div>
                      <div className="absolute bottom-0 left-0 z-999 w-full px-4 py-2.5 text-right bg-white border-t border-[#e8e8e8] rounded-b">{renderFooter(contextConfig)}</div>
                    </>
                  )}
                </Form.Item>
              )}
            </>
          )}
        </ChildrenWrapper>
      )}
    </Form>
  );

  return (
    <>
      {renderTrigger()}
      {type === 'Modal' ? (
        <Modal
          title={title}
          width={width}
          closable={closable}
          open={open}
          onCancel={handleClose}
          footer={null}
          destroyOnHidden
          {...(dmConfig as Partial<ModalProps>)}
        >
          {formContent}
        </Modal>
      ) : (
        <Drawer
          title={title}
          defaultSize={width as number}
          closable={closable}
          open={open}
          onClose={handleClose}
          footer={null}
          destroyOnHidden
          {...(dmConfig as Partial<DrawerProps>)}
        >
          {formContent}
        </Drawer>
      )}
    </>
  );
}
